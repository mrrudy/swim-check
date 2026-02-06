/**
 * Component Interface Contracts: Pool View Display Options
 * Feature Branch: 005-pool-view-options
 * Date: 2026-02-02
 *
 * These interfaces define the props for new React components.
 * Implementation must conform to these contracts.
 */

import type { LaneAvailability } from '@swim-check/shared';

// =============================================================================
// COMPACT AVAILABILITY BAR
// =============================================================================

/**
 * Props for CompactAvailabilityBar component (FR-001 through FR-004)
 *
 * Displays a color-coded horizontal progress bar showing lane availability.
 */
export interface CompactAvailabilityBarProps {
  /** Number of available lanes */
  availableCount: number;

  /** Total number of lanes */
  totalCount: number;

  /** Optional loading state - renders with reduced opacity */
  loading?: boolean;

  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Color calculation result for availability bar
 */
export interface AvailabilityColor {
  /** CSS color string (hsl format) */
  background: string;

  /** CSS color string for text (contrast-safe) */
  text: string;
}

// =============================================================================
// MULTI-SLOT VIEW
// =============================================================================

/**
 * Data for a single slot in the multi-slot view
 */
export interface SlotData {
  /** Start time in HH:MM format */
  startTime: string;

  /** End time in HH:MM format */
  endTime: string;

  /** Lane availability data (null if loading/error) */
  lanes: LaneAvailability[] | null;

  /** Available lane count (for compact view) */
  availableCount: number;

  /** Total lane count (for compact view) */
  totalCount: number;

  /** Loading state for this specific slot */
  loading: boolean;

  /** Error message if fetch failed */
  error?: string;

  /** Data freshness indicator */
  dataFreshness?: 'fresh' | 'cached' | 'stale' | 'unavailable';
}

/**
 * Props for MultiSlotView component (FR-005 through FR-007)
 *
 * Displays multiple consecutive time slots stacked vertically.
 */
export interface MultiSlotViewProps {
  /** Array of slot data (1 to 10 slots) */
  slots: SlotData[];

  /** Whether to render in compact mode */
  compactView: boolean;

  /** Date string for display (YYYY-MM-DD) */
  date: string;

  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Props for individual SlotSection component
 */
export interface SlotSectionProps {
  /** Slot data to display */
  slot: SlotData;

  /** Whether to render in compact mode */
  compactView: boolean;

  /** Optional test ID for testing */
  testId?: string;
}

// =============================================================================
// VIEW PREFERENCES PANEL
// =============================================================================

/**
 * Props for ViewPreferencesPanel component (FR-001, FR-005)
 *
 * Settings controls for compact view toggle and forward slot count.
 */
export interface ViewPreferencesPanelProps {
  /** Current compact view setting */
  compactViewEnabled: boolean;

  /** Current forward slot count (1-10) */
  forwardSlotCount: number;

  /** Callback when compact view is toggled */
  onCompactViewChange: (enabled: boolean) => void;

  /** Callback when forward slot count changes */
  onForwardSlotCountChange: (count: number) => void;

  /** Whether preferences are being saved */
  saving?: boolean;

  /** Optional test ID for testing */
  testId?: string;
}

// =============================================================================
// HOOK INTERFACES
// =============================================================================

/**
 * Return type for useViewPreferences hook
 */
export interface UseViewPreferencesReturn {
  /** Current preferences state */
  compactViewEnabled: boolean;
  forwardSlotCount: number;

  /** Loading states */
  isLoading: boolean;
  isSaving: boolean;

  /** Error state */
  error: string | null;

  /** Actions */
  setCompactViewEnabled: (enabled: boolean) => Promise<void>;
  setForwardSlotCount: (count: number) => Promise<void>;
}

/**
 * Return type for useMultiSlotData hook
 */
export interface UseMultiSlotDataReturn {
  /** Array of slot data */
  slots: SlotData[];

  /** Whether any slot is currently loading */
  isLoading: boolean;

  /** Refresh all slots */
  refresh: () => Promise<void>;
}

// =============================================================================
// UTILITY FUNCTION SIGNATURES
// =============================================================================

/**
 * Calculate availability color based on percentage
 * @param percentage - Value from 0 to 1
 * @returns Color object with background and text colors
 */
export type CalculateAvailabilityColor = (percentage: number) => AvailabilityColor;

/**
 * Generate forward slots from a starting time
 * @param startTime - Starting time in HH:MM format
 * @param duration - Slot duration in minutes
 * @param count - Number of slots to generate
 * @returns Array of {startTime, endTime} objects
 */
export type GenerateForwardSlots = (
  startTime: string,
  duration: number,
  count: number
) => Array<{ startTime: string; endTime: string }>;
