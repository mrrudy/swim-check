/**
 * AvailabilityService - Cache-aside pattern for pool availability
 */

import type { PoolAvailability, TimeSlot, LaneAvailability } from '@swim-check/shared';
import { SLOT_CONSTANTS } from '@swim-check/shared';
import { scraperRegistry } from '../scrapers/registry.js';
import { availabilityCache } from './cache.js';
import { getPoolById, getLanesByPoolId } from '../db/queries.js';
import { getDatabase } from '../db/schema.js';

export type DataFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';

interface CachedAvailability {
  lanes: LaneAvailability[];
  scrapedAt: Date;
}

export function getCacheKey(poolId: string, date: string, startTime: string, endTime: string): string {
  return `availability:${poolId}:${date}:${startTime}:${endTime}`;
}

/**
 * Calculate per-pool cache TTL based on scraper metadata.
 * Priority: cacheTtlSeconds > scrapeIntervalHours * 3600 > 24h default
 */
export function getPoolCacheTtl(scraper: { cacheTtlSeconds?: number; scrapeIntervalHours?: number } | undefined): number {
  const DEFAULT_TTL_HOURS = 24;
  if (!scraper) return DEFAULT_TTL_HOURS * 3600;
  return scraper.cacheTtlSeconds ?? (scraper.scrapeIntervalHours ? scraper.scrapeIntervalHours * 3600 : DEFAULT_TTL_HOURS * 3600);
}

/**
 * Decompose a time range into 30-minute sub-slot boundaries.
 * E.g. "06:00"-"08:00" → [["06:00","06:30"], ["06:30","07:00"], ["07:00","07:30"], ["07:30","08:00"]]
 */
export function decomposeIntoSubSlots(startTime: string, endTime: string): TimeSlot[] {
  const step = SLOT_CONSTANTS.MIN_DURATION; // 30 minutes
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  const slots: TimeSlot[] = [];
  let cursor = startMinutes;
  while (cursor < endMinutes) {
    const next = cursor + step;
    const slotStart = `${Math.floor(cursor / 60).toString().padStart(2, '0')}:${(cursor % 60).toString().padStart(2, '0')}`;
    const slotEnd = `${Math.floor(next / 60).toString().padStart(2, '0')}:${(next % 60).toString().padStart(2, '0')}`;
    slots.push({ startTime: slotStart, endTime: slotEnd });
    cursor = next;
  }
  return slots;
}

export class AvailabilityService {
  /**
   * Try to assemble a cache hit from pre-populated 30-minute sub-slots.
   * Returns merged lane data if ALL sub-slots are cached, otherwise null.
   * A lane is considered available only if it is available in every sub-slot.
   */
  private tryGetFromSubSlotCache(
    poolId: string,
    dateStr: string,
    timeSlot: TimeSlot
  ): CachedAvailability | null {
    const subSlots = decomposeIntoSubSlots(timeSlot.startTime, timeSlot.endTime);

    // Only worth decomposing if there are multiple sub-slots
    if (subSlots.length <= 1) return null;

    const subResults: CachedAvailability[] = [];
    for (const sub of subSlots) {
      const subKey = getCacheKey(poolId, dateStr, sub.startTime, sub.endTime);
      const cached = availabilityCache.get<CachedAvailability>(subKey);
      if (!cached) return null; // Any miss means we can't assemble the full range
      subResults.push(cached.value);
    }

    // Merge: a lane is available only if available in ALL sub-slots
    // Use the first sub-slot's lanes as the template
    const baseLanes = subResults[0].lanes;
    const mergedLanes: LaneAvailability[] = baseLanes.map(lane => {
      const availableInAll = subResults.every(sub => {
        const matchingLane = sub.lanes.find(l => l.laneId === lane.laneId);
        return matchingLane?.isAvailable ?? true; // if lane not found in sub-slot, assume available
      });

      return {
        ...lane,
        isAvailable: availableInAll,
      };
    });

    // Use the oldest scrapedAt from all sub-slots
    const oldestScrapedAt = subResults.reduce((oldest, sub) => {
      const subTime = sub.scrapedAt instanceof Date ? sub.scrapedAt : new Date(sub.scrapedAt);
      return subTime < oldest ? subTime : oldest;
    }, subResults[0].scrapedAt instanceof Date ? subResults[0].scrapedAt : new Date(subResults[0].scrapedAt));

    return { lanes: mergedLanes, scrapedAt: oldestScrapedAt };
  }

  /**
   * Get availability with cache-aside pattern:
   * 1. Check exact cache key
   * 2. Try assembling from pre-populated 30-min sub-slot cache entries
   * 3. If miss, scrape
   * 4. Store result
   * 5. Return with freshness indicator
   */
  async getAvailability(
    poolId: string,
    date: Date,
    timeSlot: TimeSlot,
    forceRefresh = false
  ): Promise<PoolAvailability> {
    const pool = getPoolById(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }

    const dateStr = this.formatDate(date);
    const cacheKey = getCacheKey(poolId, dateStr, timeSlot.startTime, timeSlot.endTime);

    // Resolve per-pool cache TTL from scraper metadata
    const scraper = scraperRegistry.get(poolId);
    const cacheTtlSeconds = getPoolCacheTtl(scraper);

    // Check cache unless force refresh
    if (!forceRefresh) {
      // 1. Try exact cache key match
      const cached = availabilityCache.get<CachedAvailability>(cacheKey);
      if (cached) {
        return this.buildResponse(
          pool,
          dateStr,
          timeSlot,
          cached.value.lanes,
          'cached',
          cached.value.scrapedAt
        );
      }

      // 2. Try assembling from pre-populated 30-min sub-slot cache entries
      const assembled = this.tryGetFromSubSlotCache(poolId, dateStr, timeSlot);
      if (assembled) {
        return this.buildResponse(
          pool,
          dateStr,
          timeSlot,
          assembled.lanes,
          'cached',
          assembled.scrapedAt
        );
      }
    }

    // Try to scrape fresh data
    if (!scraper) {
      // No scraper available - check for stale cache
      const stale = this.getStaleCacheEntry(cacheKey);
      if (stale) {
        return this.buildResponse(pool, dateStr, timeSlot, stale.lanes, 'stale', stale.scrapedAt);
      }

      // Generate default availability based on pool's lanes
      const lanes = getLanesByPoolId(poolId);
      const defaultAvailability: LaneAvailability[] = lanes.map((lane) => ({
        laneId: lane.id,
        laneNumber: lane.laneNumber,
        label: lane.label,
        isAvailable: true,
        lastUpdated: new Date(),
      }));

      return this.buildResponse(pool, dateStr, timeSlot, defaultAvailability, 'unavailable');
    }

    try {
      const lanes = await this.scrapeWithRetry(scraper, date, timeSlot);
      const scrapedAt = new Date();

      // Cache the result with per-pool TTL
      availabilityCache.set(cacheKey, { lanes, scrapedAt }, cacheTtlSeconds);

      return this.buildResponse(pool, dateStr, timeSlot, lanes, 'fresh', scrapedAt);
    } catch (error) {
      console.error(`Scraper failed for pool ${poolId}:`, error);

      // Try stale cache as fallback
      const stale = this.getStaleCacheEntry(cacheKey);
      if (stale) {
        return this.buildResponse(pool, dateStr, timeSlot, stale.lanes, 'stale', stale.scrapedAt);
      }

      // No data available
      return this.buildResponse(pool, dateStr, timeSlot, [], 'unavailable');
    }
  }


  private async scrapeWithRetry(
    scraper: { fetchAvailability: (date: Date, timeSlot: TimeSlot) => Promise<LaneAvailability[]> },
    date: Date,
    timeSlot: TimeSlot,
    maxRetries = 3
  ): Promise<LaneAvailability[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await scraper.fetchAvailability(date, timeSlot);
      } catch (error) {
        lastError = error as Error;
        const isRateLimited = this.isRateLimitError(error);
        console.warn(`Scrape attempt ${attempt} failed${isRateLimited ? ' (rate limited)' : ''}:`, error);

        if (attempt < maxRetries) {
          // Use longer backoff for rate limit errors (30s, 60s) vs normal errors (1s, 2s, 4s)
          const baseDelay = isRateLimited ? 30000 : 1000;
          await this.delay(Math.pow(2, attempt - 1) * baseDelay);
        }
      }
    }

    throw lastError || new Error('Scrape failed after retries');
  }

  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.status === 429 || err.code === 429) return true;
      if (typeof err.message === 'string' && err.message.includes('Quota exceeded')) return true;
    }
    return false;
  }

  private getStaleCacheEntry(cacheKey: string): CachedAvailability | null {
    // Query the database for expired entries to use as stale fallback
    const db = getDatabase();
    const result = db.exec(
      'SELECT value FROM cache_entries WHERE key = ?',
      [cacheKey]
    );

    if (!result[0] || result[0].values.length === 0) {
      return null;
    }

    try {
      const row = result[0].values[0];
      return JSON.parse(row[0] as string) as CachedAvailability;
    } catch {
      return null;
    }
  }

  private buildResponse(
    pool: NonNullable<ReturnType<typeof getPoolById>>,
    date: string,
    timeSlot: TimeSlot,
    lanes: LaneAvailability[],
    dataFreshness: DataFreshness,
    scrapedAt?: Date
  ): PoolAvailability {
    const availableLaneCount = lanes.filter((l) => l.isAvailable).length;

    return {
      pool,
      date,
      timeSlot,
      lanes,
      dataFreshness,
      scrapedAt,
      availableLaneCount,
      totalLaneCount: lanes.length,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const availabilityService = new AvailabilityService();
