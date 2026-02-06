/**
 * AvailabilityService - Cache-aside pattern for pool availability
 */

import type { PoolAvailability, TimeSlot, LaneAvailability } from '@swim-check/shared';
import { scraperRegistry } from '../scrapers/registry.js';
import { availabilityCache } from './cache.js';
import { getPoolById, getLanesByPoolId } from '../db/queries.js';
import { getDatabase } from '../db/schema.js';

export type DataFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';

interface CachedAvailability {
  lanes: LaneAvailability[];
  scrapedAt: Date;
}

function getCacheKey(poolId: string, date: string, startTime: string, endTime: string): string {
  return `availability:${poolId}:${date}:${startTime}:${endTime}`;
}

export class AvailabilityService {
  /**
   * Get availability with cache-aside pattern:
   * 1. Check cache
   * 2. If miss, scrape
   * 3. Store result
   * 4. Return with freshness indicator
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

    // Check cache unless force refresh
    if (!forceRefresh) {
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
    }

    // Try to scrape fresh data
    const scraper = scraperRegistry.get(poolId);
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

      // Cache the result
      availabilityCache.set(cacheKey, { lanes, scrapedAt });

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
        console.warn(`Scrape attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s...
          await this.delay(Math.pow(2, attempt - 1) * 1000);
        }
      }
    }

    throw lastError || new Error('Scrape failed after retries');
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
