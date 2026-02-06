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
