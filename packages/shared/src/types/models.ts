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

// ==========================================
// Slot Navigation Types (002-slot-navigation)
// ==========================================

/**
 * Represents the current state of slot navigation in the UI
 */
export interface SlotNavigationState {
  /** Index into TIME_OPTIONS array (0-34) */
  currentSlotIndex: number;

  /** Currently selected start time (HH:MM) */
  startTime: string;

  /** Currently selected end time (HH:MM) */
  endTime: string;

  /** Current duration in minutes (30-480) */
  duration: number;

  /** Whether the availability view container has keyboard focus */
  hasFocus: boolean;
}

/**
 * Computed boundaries for navigation actions
 */
export interface NavigationBoundaries {
  /** Can navigate to previous slot (not at first slot) */
  canNavigatePrevious: boolean;

  /** Can navigate to next slot (not at last valid slot) */
  canNavigateNext: boolean;

  /** Can extend duration (won't exceed closing/conflict) */
  canExtend: boolean;

  /** Can reduce duration (duration > 30 minutes) */
  canReduce: boolean;

  /** Reason if extend is blocked */
  extendBlockedReason?: 'pool_closing' | 'booking_conflict';
}

/**
 * Actions that can be performed on slot navigation
 */
export interface SlotNavigationCallbacks {
  navigatePrevious: () => void;
  navigateNext: () => void;
  extendDuration: () => void;
  reduceDuration: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  setFocus: (hasFocus: boolean) => void;
}

// ==========================================
// Scrape Job Types (003-midnight-rescrape)
// ==========================================

/**
 * Tracks the state and history of scrape operations for each pool
 */
export interface ScrapeJob {
  poolId: string;
  lastScrapeDate: string | null; // YYYY-MM-DD
  lastScrapeTimestamp: Date | null;
  lastScrapeStatus: 'success' | 'failure' | null;
  lastErrorMessage: string | null;
}

/**
 * Runtime-only state for preventing concurrent scrapes (not persisted)
 */
export interface ScrapeState {
  poolId: string;
  inProgress: boolean;
  startedAt: Date | null;
}

/**
 * Scrape result for logging/reporting
 */
export interface ScrapeResult {
  poolId: string;
  poolName: string;
  success: boolean;
  duration: number; // milliseconds
  errorMessage?: string;
  retriesUsed: number;
}

/**
 * Scheduler status for API response
 */
export interface SchedulerStatus {
  isRunning: boolean;
  nextScheduledRun: Date | null;
  lastRunTimestamp: Date | null;
  poolStatuses: PoolScrapeStatus[];
}

/**
 * Per-pool scrape status for scheduler status response
 */
export interface PoolScrapeStatus {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null;
  lastScrapeStatus: 'success' | 'failure' | null;
  inProgress: boolean;
}

/** Pool operating hours and slot constants */
export const SLOT_CONSTANTS = {
  /** First available time slot */
  FIRST_SLOT: '05:00',

  /** Last available time slot (pool closing) */
  LAST_SLOT: '22:00',

  /** Minimum booking duration in minutes */
  MIN_DURATION: 30,

  /** Maximum booking duration in minutes */
  MAX_DURATION: 480, // 8 hours

  /** Duration adjustment step in minutes */
  DURATION_STEP: 30,

  /** Total number of time slots */
  SLOT_COUNT: 35, // (22-5)*2 + 1

  /** First slot index */
  FIRST_SLOT_INDEX: 0,

  /** Last slot index */
  LAST_SLOT_INDEX: 34,
} as const;
