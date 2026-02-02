/**
 * API request/response types for Swim Lane Booking Checker
 * Based on OpenAPI contract
 */

import type { SwimmingPool, UserPreferences, LaneAvailability, TimeSlot } from './models.js';

// Error response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pool endpoints
export interface ListPoolsParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPoolsResponse {
  pools: SwimmingPool[];
  total: number;
}

// Availability endpoints
export interface GetAvailabilityParams {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  refresh?: boolean;
}

export interface PoolAvailabilityResponse {
  pool: SwimmingPool;
  date: string;
  timeSlot: TimeSlot;
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
  scrapedAt?: string;
  availableLaneCount: number;
  totalLaneCount: number;
}

// Favorites endpoints
export interface FavoritePoolResponse {
  pool: SwimmingPool;
  addedAt: string;
  displayOrder: number;
}

export interface ListFavoritesResponse {
  favorites: FavoritePoolResponse[];
}

export interface AddFavoriteRequest {
  poolId: string;
}

export interface ReorderFavoritesRequest {
  order: string[];
}

// Preferences endpoints
export interface UpdatePreferencesRequest {
  slotDurationMins?: number;
}

export interface UserPreferencesResponse {
  id: string;
  slotDurationMins: number;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultTimeSlotResponse {
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;
}

// Health endpoint
export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  scrapers?: {
    healthy: number;
    unhealthy: number;
  };
}

// ==========================================
// Admin API Types (003-midnight-rescrape)
// ==========================================

/**
 * Response for POST /admin/rescrape
 */
export interface RescrapeResponse {
  message: string;
  pools: PoolInfo[];
}

/**
 * Pool info for rescrape response
 */
export interface PoolInfo {
  poolId: string;
  poolName: string;
}

/**
 * Response for GET /admin/scheduler/status
 */
export interface SchedulerStatusResponse {
  isRunning: boolean;
  nextScheduledRun: string | null; // ISO 8601
  lastRunTimestamp: string | null; // ISO 8601
  poolStatuses: PoolScrapeStatusResponse[];
}

/**
 * Per-pool scrape status in scheduler status response
 */
export interface PoolScrapeStatusResponse {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null; // YYYY-MM-DD
  lastScrapeStatus: 'success' | 'failure' | null;
  inProgress: boolean;
}

/**
 * Error response for admin endpoints
 */
export interface AdminErrorResponse {
  error: string;
  poolId?: string;
  details?: string;
}
