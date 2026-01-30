/**
 * PoolScraper interface contract
 * All pool scrapers must implement this interface
 */

import type { TimeSlot, LaneAvailability } from '@swim-check/shared';

export interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
}

export interface PoolScraper extends PoolScraperMetadata {
  /**
   * Fetch lane availability for a specific date and time slot
   * @param date The date to check availability for
   * @param timeSlot The time range to check
   * @returns Array of lane availability information
   */
  fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]>;

  /**
   * Check if the scraper is healthy (can reach the target website)
   * @returns true if the scraper is operational
   */
  isHealthy(): Promise<boolean>;
}

export interface ScraperConfig {
  minDelayMs: number;
  maxDelayMs: number;
  requestTimeoutMs: number;
  maxRetries: number;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  minDelayMs: 2000,
  maxDelayMs: 6000,
  requestTimeoutMs: 30000,
  maxRetries: 3,
};

export interface ScraperError {
  code: 'TIMEOUT' | 'NETWORK' | 'PARSE' | 'AUTH' | 'RATE_LIMIT' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}

export function createScraperError(
  code: ScraperError['code'],
  message: string,
  retryable = true
): ScraperError {
  return { code, message, retryable };
}
