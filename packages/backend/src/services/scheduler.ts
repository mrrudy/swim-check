/**
 * Midnight scheduler service (003-midnight-rescrape)
 *
 * Handles:
 * - Scheduling scrapes for midnight
 * - Startup check for missing today's data
 * - Rescheduling after each midnight trigger
 */

import { config } from '../config.js';
import { getPoolsNeedingScrapeToday } from '../db/scrapeJobs.js';

// Internal scheduler state
let nextRunTimeout: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;
let nextScheduledRun: Date | null = null;
let lastRunTimestamp: Date | null = null;
let onMidnightCallback: (() => void) | null = null;

/**
 * Calculate milliseconds until next midnight (local time)
 */
export function calculateMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight

  const msUntilMidnight = midnight.getTime() - now.getTime();

  // If we're exactly at midnight, schedule for tomorrow
  if (msUntilMidnight === 0) {
    return 24 * 60 * 60 * 1000;
  }

  return msUntilMidnight;
}

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Schedule the next midnight run
 */
function scheduleNextRun(): void {
  if (!config.schedulerEnabled) {
    console.log('[Scheduler] Disabled via SCHEDULER_ENABLED=false');
    return;
  }

  const msUntilMidnight = calculateMsUntilMidnight();
  nextScheduledRun = new Date(Date.now() + msUntilMidnight);

  console.log(`[Scheduler] Next run scheduled for ${nextScheduledRun.toISOString()}`);

  nextRunTimeout = setTimeout(() => {
    handleMidnightTrigger();
  }, msUntilMidnight);
}

/**
 * Handle midnight trigger - call callback and reschedule
 */
function handleMidnightTrigger(): void {
  lastRunTimestamp = new Date();
  console.log(`[Scheduler] Midnight trigger at ${lastRunTimestamp.toISOString()}`);

  if (onMidnightCallback) {
    onMidnightCallback();
  }

  // Reschedule for next midnight
  scheduleNextRun();
}

/**
 * Start the scheduler
 * @param callback Function to call at midnight (typically scrapeAllPools)
 */
export function startScheduler(callback: () => void): void {
  if (isRunning) {
    console.log('[Scheduler] Already running');
    return;
  }

  onMidnightCallback = callback;
  isRunning = true;

  console.log('[Scheduler] Starting midnight scheduler');
  scheduleNextRun();
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (nextRunTimeout) {
    clearTimeout(nextRunTimeout);
    nextRunTimeout = null;
  }

  isRunning = false;
  nextScheduledRun = null;
  onMidnightCallback = null;

  console.log('[Scheduler] Stopped');
}

/**
 * Get current scheduler state
 */
export function getSchedulerState(): {
  isRunning: boolean;
  nextScheduledRun: Date | null;
  lastRunTimestamp: Date | null;
} {
  return {
    isRunning,
    nextScheduledRun,
    lastRunTimestamp,
  };
}

/**
 * Check on startup if today's data exists and scrape if missing (T014)
 * Returns the list of pool IDs that need scraping, or empty array if all up to date
 */
export async function checkAndScrapeOnStartup(): Promise<{
  needsScrape: boolean;
  poolIds: string[];
}> {
  const todayDate = getTodayDate();
  console.log(`[Scheduler] Startup check for date: ${todayDate}`);

  const poolsNeedingScrape = getPoolsNeedingScrapeToday(todayDate);

  if (poolsNeedingScrape.length === 0) {
    console.log('[Scheduler] Startup check: All pools have today\'s data');
    return { needsScrape: false, poolIds: [] };
  }

  console.log(
    `[Scheduler] Startup check: ${poolsNeedingScrape.length} pool(s) need scraping: ${poolsNeedingScrape.join(', ')}`
  );

  return { needsScrape: true, poolIds: poolsNeedingScrape };
}

/**
 * Set last run timestamp (for testing/manual triggers)
 */
export function setLastRunTimestamp(timestamp: Date): void {
  lastRunTimestamp = timestamp;
}
