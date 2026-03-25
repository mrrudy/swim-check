/**
 * Scrape orchestrator service (003-midnight-rescrape)
 *
 * Coordinates scraping across multiple pools:
 * - Sequential execution with delays
 * - Retry logic with exponential backoff
 * - Concurrency prevention via locks
 * - Result aggregation
 */

import { config } from '../config.js';
import { scraperRegistry } from '../scrapers/registry.js';
import { getPoolById } from '../db/queries.js';
import { markScrapeSuccess, markScrapeFailure } from '../db/scrapeJobs.js';
import {
  setScrapeInProgress,
  clearScrapeInProgress,
  isAnyScrapeInProgress,
} from './scrapeState.js';
import { getTodayDate } from './scheduler.js';
import { getCacheKey, getPoolCacheTtl } from './availability.js';
import { availabilityCache } from './cache.js';
import type { ScrapeResult, TimeSlot } from '@swim-check/shared';
import { SLOT_CONSTANTS } from '@swim-check/shared';

// Exponential backoff base delay (2 seconds)
const BACKOFF_BASE_MS = 2000;

/**
 * Generate 30-minute time slots from current time (rounded up) to end-of-day (22:00).
 * Only returns future slots - past slots are skipped.
 */
export function generateFutureSlots(currentTime: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Parse operating hours from SLOT_CONSTANTS
  const [firstH, firstM] = SLOT_CONSTANTS.FIRST_SLOT.split(':').map(Number);
  const [lastH, lastM] = SLOT_CONSTANTS.LAST_SLOT.split(':').map(Number);
  const firstMinutes = firstH * 60 + firstM;
  const lastMinutes = lastH * 60 + lastM;

  // Current time in minutes since midnight
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Round up to next 30-minute boundary
  let startMinutes = Math.ceil(currentMinutes / 30) * 30;

  // Clamp to operating hours
  if (startMinutes < firstMinutes) startMinutes = firstMinutes;

  // Generate slots
  while (startMinutes < lastMinutes) {
    const endMinutes = startMinutes + SLOT_CONSTANTS.MIN_DURATION;
    if (endMinutes > lastMinutes) break;

    const startTime = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    slots.push({ startTime, endTime });
    startMinutes = endMinutes;
  }

  return slots;
}

/**
 * Generate all 30-minute time slots for a full operating day (05:00-22:00).
 */
export function generateAllDaySlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [firstH, firstM] = SLOT_CONSTANTS.FIRST_SLOT.split(':').map(Number);
  const [lastH, lastM] = SLOT_CONSTANTS.LAST_SLOT.split(':').map(Number);
  const firstMinutes = firstH * 60 + firstM;
  const lastMinutes = lastH * 60 + lastM;

  let startMinutes = firstMinutes;
  while (startMinutes < lastMinutes) {
    const endMinutes = startMinutes + SLOT_CONSTANTS.MIN_DURATION;
    if (endMinutes > lastMinutes) break;

    const startTime = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    slots.push({ startTime, endTime });
    startMinutes = endMinutes;
  }

  return slots;
}

/**
 * Pre-populate the availability cache for a pool after a successful scrape.
 * Iterates over all available dates from the scraper, generating:
 * - For today: only future slots (from current time rounded up)
 * - For future dates: all slots for the full day
 * Past dates are skipped.
 */
export async function prepopulateCacheForPool(poolId: string, todayStr: string): Promise<void> {
  const scraper = scraperRegistry.get(poolId);
  if (!scraper) return;

  const pool = getPoolById(poolId);
  const poolName = pool?.name ?? poolId;

  // Determine which dates to pre-populate
  const availableDates = scraper.getAvailableDates?.() ?? [todayStr];
  const datesToCache = availableDates.filter(d => d >= todayStr).sort();

  if (datesToCache.length === 0) return;

  const cacheTtl = getPoolCacheTtl(scraper);
  let totalCachedCount = 0;

  for (const dateStr of datesToCache) {
    const isToday = dateStr === todayStr;
    const slots = isToday ? generateFutureSlots(new Date()) : generateAllDaySlots();
    if (slots.length === 0) continue;

    const date = new Date(dateStr + 'T00:00:00');

    for (const slot of slots) {
      try {
        const lanes = await scraper.fetchAvailability(date, slot);
        const cacheKey = getCacheKey(poolId, dateStr, slot.startTime, slot.endTime);
        availabilityCache.set(cacheKey, { lanes, scrapedAt: new Date() }, cacheTtl);
        totalCachedCount++;
      } catch (error) {
        console.warn(`[CachePrePopulate] Failed to cache slot ${dateStr} ${slot.startTime}-${slot.endTime} for ${poolName}:`, error);
      }
    }
  }

  if (totalCachedCount > 0) {
    const firstDate = datesToCache[0];
    const lastDate = datesToCache[datesToCache.length - 1];
    console.log(`[CachePrePopulate] Pre-populated ${totalCachedCount} slots for ${poolName} (${firstDate} to ${lastDate})`);
  }
}

/**
 * Get a random delay between min and max (for delay between pools)
 */
export function getRandomDelay(): number {
  const { scrapeDelayMinMs, scrapeDelayMaxMs } = config;
  return Math.floor(Math.random() * (scrapeDelayMaxMs - scrapeDelayMinMs + 1)) + scrapeDelayMinMs;
}

/**
 * Calculate exponential backoff delay
 * @param retryCount Current retry attempt (0-indexed)
 * @returns Delay in milliseconds (2s, 4s, 8s)
 */
function getBackoffDelay(retryCount: number): number {
  return BACKOFF_BASE_MS * Math.pow(2, retryCount);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape a single pool with retry logic
 * @param poolId Pool ID to scrape
 * @returns Scrape result
 */
export async function scrapePool(poolId: string): Promise<ScrapeResult> {
  const pool = getPoolById(poolId);
  const poolName = pool?.name ?? 'Unknown Pool';
  const todayDate = getTodayDate();

  const startTime = Date.now();
  let retriesUsed = 0;
  let lastError: string | undefined;

  // Try to acquire lock
  if (!setScrapeInProgress(poolId)) {
    console.log(`[Orchestrator] Pool ${poolName} (${poolId}) already being scraped - skipping`);
    return {
      poolId,
      poolName,
      success: false,
      duration: 0,
      errorMessage: 'Scrape already in progress',
      retriesUsed: 0,
    };
  }

  try {
    const scraper = scraperRegistry.get(poolId);

    if (!scraper) {
      console.log(`[Orchestrator] No scraper registered for pool ${poolId}`);
      markScrapeFailure(poolId, todayDate, 'No scraper registered');
      return {
        poolId,
        poolName,
        success: false,
        duration: Date.now() - startTime,
        errorMessage: 'No scraper registered',
        retriesUsed: 0,
      };
    }

    // Attempt scrape with retries
    for (let attempt = 0; attempt <= config.scrapeRetryCount; attempt++) {
      try {
        if (attempt > 0) {
          const backoffDelay = getBackoffDelay(attempt - 1);
          console.log(
            `[Orchestrator] Retry ${attempt}/${config.scrapeRetryCount} for ${poolName} after ${backoffDelay}ms`
          );
          await sleep(backoffDelay);
          retriesUsed = attempt;
        }

        console.log(`[Orchestrator] Scraping ${poolName} (attempt ${attempt + 1})`);

        // Check scraper health first
        const isHealthy = await scraper.isHealthy();
        if (!isHealthy) {
          throw new Error('Scraper health check failed');
        }

        // Fetch availability for today (use a full day time slot for the scrape)
        const timeSlot = { startTime: '05:00', endTime: '22:00' };
        await scraper.fetchAvailability(new Date(), timeSlot);

        // Get resolved source URLs if the scraper supports it (006-scraping-status-view)
        const resolvedSourceUrls = scraper.getResolvedSourceUrls?.();

        // Success!
        console.log(`[Orchestrator] Successfully scraped ${poolName} in ${Date.now() - startTime}ms`);
        markScrapeSuccess(poolId, todayDate, resolvedSourceUrls);

        // Pre-populate cache for all future slots (012-scrape-cache-prepopulate)
        await prepopulateCacheForPool(poolId, todayDate);

        const duration = Date.now() - startTime;
        return {
          poolId,
          poolName,
          success: true,
          duration,
          retriesUsed,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.log(`[Orchestrator] Scrape attempt failed for ${poolName}: ${lastError}`);
      }
    }

    // All retries exhausted
    const duration = Date.now() - startTime;
    console.log(
      `[Orchestrator] All retries exhausted for ${poolName}. Last error: ${lastError}`
    );
    markScrapeFailure(poolId, todayDate, lastError ?? 'Unknown error');

    return {
      poolId,
      poolName,
      success: false,
      duration,
      errorMessage: lastError,
      retriesUsed,
    };
  } finally {
    // Always release lock
    clearScrapeInProgress(poolId);
  }
}

/**
 * Scrape all registered pools sequentially
 * @param poolIds Optional specific pool IDs to scrape. If not provided, scrapes all registered pools.
 * @returns Array of scrape results
 */
export async function scrapeAllPools(poolIds?: string[]): Promise<ScrapeResult[]> {
  // Check if any scrape is already in progress
  if (isAnyScrapeInProgress()) {
    console.log('[Orchestrator] Another scrape operation is in progress - aborting');
    return [];
  }

  const targetPools = poolIds ?? scraperRegistry.getAll().map((s) => s.poolId);

  if (targetPools.length === 0) {
    console.log('[Orchestrator] No pools to scrape');
    return [];
  }

  console.log(`[Orchestrator] Starting scrape for ${targetPools.length} pool(s)`);

  const results: ScrapeResult[] = [];

  for (let i = 0; i < targetPools.length; i++) {
    const poolId = targetPools[i];

    // Scrape the pool
    const result = await scrapePool(poolId);
    results.push(result);

    // Wait before next pool (unless this is the last one)
    if (i < targetPools.length - 1) {
      const delay = getRandomDelay();
      console.log(`[Orchestrator] Waiting ${delay}ms before next pool`);
      await sleep(delay);
    }
  }

  // Log summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(
    `[Orchestrator] Scrape complete: ${successful} successful, ${failed} failed out of ${results.length} pools`
  );

  return results;
}

/**
 * Trigger scrape for a specific pool (for manual/API triggers)
 * @param poolId Pool ID to scrape
 * @returns Scrape result
 */
export async function triggerSinglePoolScrape(poolId: string): Promise<ScrapeResult> {
  return scrapePool(poolId);
}
