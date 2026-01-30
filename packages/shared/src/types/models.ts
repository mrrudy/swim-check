/**
 * Core domain models for Swim Lane Booking Checker
 */

export interface SwimmingPool {
  id: string;
  name: string;
  location: string;
  websiteUrl: string;
  totalLanes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lane {
  id: string;
  poolId: string;
  laneNumber: number;
  label?: string;
}

export interface LaneBooking {
  laneId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isBooked: boolean;
  scrapedAt: Date;
}

export interface PoolScraper {
  poolId: string;
  scraperType: string;
  version: string;
  lastHealthCheck?: Date;
  isHealthy: boolean;
}

export interface UserPreferences {
  id: string;
  slotDurationMins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritePool {
  preferenceId: string;
  poolId: string;
  addedAt: Date;
  displayOrder: number;
}

export interface TimeSlot {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface LaneAvailability {
  laneId: string;
  laneNumber: number;
  label?: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface PoolAvailability {
  pool: SwimmingPool;
  date: string;
  timeSlot: TimeSlot;
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
  scrapedAt?: Date;
  availableLaneCount: number;
  totalLaneCount: number;
}
