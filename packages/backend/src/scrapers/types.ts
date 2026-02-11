/**
 * PoolScraper interface contract
 * All pool scrapers must implement this interface
 */

import type { TimeSlot, LaneAvailability, ResolvedSourceLink } from '@swim-check/shared';

/**
 * A URL used for scraping pool data (006-scraping-status-view)
 */
export interface SourceLink {
  url: string;
  label: string;
}

export interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
  sourceUrls?: SourceLink[]; // Optional static source URLs (006-scraping-status-view)
  scrapeIntervalHours?: number; // Optional per-pool scrape interval in hours (010-teatralna-pool-scraper)
  cacheTtlSeconds?: number; // Optional per-pool cache TTL; defaults to scrapeIntervalHours (or 24h if not set)
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

  /**
   * Get URLs discovered during the last successful scrape (006-scraping-status-view)
   * These are dynamically resolved URLs (e.g., the actual PDF link)
   * @returns Array of resolved source links, or undefined if not applicable
   */
  getResolvedSourceUrls?(): ResolvedSourceLink[] | undefined;
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
