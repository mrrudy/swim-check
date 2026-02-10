/**
 * Configuration for Teatralna Basen 1 pool scraper (010-teatralna-pool-scraper)
 *
 * All configurable constants are centralized here.
 * To adapt this scraper for another spa.wroc.pl pool (e.g., Basen 2 or Basen 3),
 * create a new config with different values.
 */

/** Configuration interface for SPA Wrocław pool scrapers */
export interface TeatralnaConfig {
  /** UUID for this pool (follows existing sequential pattern) */
  POOL_ID: string;
  /** Display name shown in the UI */
  POOL_NAME: string;
  /** Base URL for the booking schedule page (used for health checks and source links) */
  SCHEDULE_URL: string;
  /** AJAX endpoint that returns the schedule table HTML fragment */
  AJAX_SCHEDULE_URL: string;
  /** POST body parameter: booking system ID for this pool */
  BOOKING_IDS: string;
  /** Maximum swimming spots in the pool */
  TOTAL_SPOTS: number;
  /** Number of spots that constitute one conceptual lane */
  SPOTS_PER_LANE: number;
  /** How often to scrape (in hours). The booking system is live, so frequent updates are needed */
  SCRAPE_INTERVAL_HOURS: number;
}

export const TEATRALNA_CONFIG: TeatralnaConfig = {
  POOL_ID: '00000000-0000-0000-0000-000000000004',
  POOL_NAME: 'SPA Teatralna - Basen 1',
  SCHEDULE_URL: 'https://klient.spa.wroc.pl/index.php?s=basen_1',
  /** AJAX endpoint that returns the schedule table HTML fragment */
  AJAX_SCHEDULE_URL: 'https://klient.spa.wroc.pl/ajax_calendar.php',
  /** POST body parameter: booking system ID for Basen 1 */
  BOOKING_IDS: '21',
  TOTAL_SPOTS: 30,
  SPOTS_PER_LANE: 6,
  SCRAPE_INTERVAL_HOURS: 3,
};
