/**
 * View types for Pool View Display Options (005-pool-view-options)
 * Frontend-specific types for compact view and multi-slot display
 */

import type { LaneAvailability } from '@swim-check/shared';

/** Aggregated availability for compact view */
export interface AvailabilitySummary {
  availableCount: number;
  totalCount: number;
  percentage: number; // 0-1
}

/** Slot loading status */
export type SlotStatus = 'loading' | 'loaded' | 'error' | 'unavailable';

/** Data freshness indicator */
export type DataFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';

/** Data for a single slot in multi-slot view */
export interface SlotViewData {
  startTime: string;
  endTime: string;
  header: string;
  lanes: LaneAvailability[];
  summary: AvailabilitySummary;
  status: SlotStatus;
  dataFreshness?: DataFreshness;
  error?: string;
}

/** View preferences state */
export interface ViewPreferencesState {
  compactViewEnabled: boolean;
  forwardSlotCount: number;
  isLoading: boolean;
  isSaving: boolean;
}

// ==========================================
// Combined Favorites View Types (007-favorites-combined-view)
// ==========================================

import type { SwimmingPool } from '@swim-check/shared';

/**
 * Availability data for a single favorite pool within a time slot.
 * Used in the combined favorites view.
 */
export interface FavoritePoolSlotData {
  /** The pool entity */
  pool: SwimmingPool;

  /** Display order from favorites list (lower = higher priority) */
  displayOrder: number;

  /** Lane availability data for this slot */
  lanes: LaneAvailability[];

  /** Available lane count (convenience field) */
  availableCount: number;

  /** Total lane count (convenience field) */
  totalCount: number;

  /** Data freshness indicator */
  dataFreshness: DataFreshness;

  /** Loading state for this specific pool */
  status: SlotStatus;

  /** Error message if fetch failed */
  error?: string;
}

/**
 * A time slot section showing all favorite pools' availability.
 * This is the primary data structure for the combined view.
 */
export interface CombinedSlotData {
  /** Time slot start time (HH:MM) */
  startTime: string;

  /** Time slot end time (HH:MM) */
  endTime: string;

  /** Formatted header (e.g., "13:30 - 14:00") */
  header: string;

  /** Availability data for each favorite pool, ordered by displayOrder */
  favorites: FavoritePoolSlotData[];

  /** Overall loading state (true if any pool is still loading) */
  isLoading: boolean;

  /** Whether all pools have error or unavailable status */
  allFailed: boolean;
}

/**
 * State for the combined favorites view, returned by useCombinedFavoritesData hook.
 */
export interface CombinedFavoritesState {
  /** Array of time slots with combined availability data */
  slots: CombinedSlotData[];

  /** True if initial favorites list is loading */
  isLoadingFavorites: boolean;

  /** True if any availability data is loading */
  isLoadingAvailability: boolean;

  /** True if no favorites exist */
  isEmpty: boolean;

  /** Error message if favorites list fetch failed */
  favoritesError?: string;

  /** Refresh function to refetch all data */
  refresh: () => void;
}
