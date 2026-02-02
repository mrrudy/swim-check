/**
 * In-memory scrape state management for preventing concurrent scrapes (003-midnight-rescrape)
 *
 * This module provides lock mechanism to prevent duplicate concurrent scrapes.
 * State is NOT persisted - resets on application start.
 */

import type { ScrapeState } from '@swim-check/shared';

// In-memory state map: poolId -> ScrapeState
const scrapeStates = new Map<string, ScrapeState>();

/**
 * Get scrape state for a specific pool
 */
export function getScrapeState(poolId: string): ScrapeState {
  const state = scrapeStates.get(poolId);
  if (state) {
    return state;
  }

  // Return default state if not found
  return {
    poolId,
    inProgress: false,
    startedAt: null,
  };
}

/**
 * Mark a pool's scrape as in progress (acquire lock)
 * Returns true if lock was acquired, false if already in progress
 */
export function setScrapeInProgress(poolId: string): boolean {
  const currentState = scrapeStates.get(poolId);

  if (currentState?.inProgress) {
    return false; // Already in progress
  }

  scrapeStates.set(poolId, {
    poolId,
    inProgress: true,
    startedAt: new Date(),
  });

  return true;
}

/**
 * Clear scrape in progress state (release lock)
 */
export function clearScrapeInProgress(poolId: string): void {
  scrapeStates.set(poolId, {
    poolId,
    inProgress: false,
    startedAt: null,
  });
}

/**
 * Reset all scrape states (called on application start)
 */
export function resetAllScrapeStates(): void {
  scrapeStates.clear();
}

/**
 * Check if any scrape is currently in progress
 */
export function isAnyScrapeInProgress(): boolean {
  for (const state of scrapeStates.values()) {
    if (state.inProgress) {
      return true;
    }
  }
  return false;
}

/**
 * Get all pools currently being scraped
 */
export function getPoolsInProgress(): string[] {
  const poolIds: string[] = [];
  for (const state of scrapeStates.values()) {
    if (state.inProgress) {
      poolIds.push(state.poolId);
    }
  }
  return poolIds;
}

/**
 * Get all scrape states (for status reporting)
 */
export function getAllScrapeStates(): ScrapeState[] {
  return Array.from(scrapeStates.values());
}
