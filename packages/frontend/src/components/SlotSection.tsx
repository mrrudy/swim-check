/**
 * SlotSection - Displays a single time slot with header and availability data
 * Can render in compact or detailed mode
 * 005-pool-view-options
 */

import type { LaneAvailability } from '@swim-check/shared';
import { CompactAvailabilityBar } from './CompactAvailabilityBar';
import { LaneGrid } from './LaneGrid';

/** Data for a single slot */
export interface SlotData {
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Lane availability data (empty array if loading/error) */
  lanes: LaneAvailability[];
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

export interface SlotSectionProps {
  /** Slot data to display */
  slot: SlotData;
  /** Whether to render in compact mode */
  compactView: boolean;
  /** Optional test ID for testing */
  testId?: string;
}

const styles = {
  container: {
    marginBottom: '16px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
    padding: '8px 12px',
    backgroundColor: '#f0f4f8',
    borderRadius: '6px',
  } as React.CSSProperties,
  timeRange: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
  freshness: {
    fontSize: '12px',
    color: '#666',
    marginLeft: 'auto',
  } as React.CSSProperties,
  error: {
    padding: '12px 16px',
    backgroundColor: '#ffeaea',
    border: '1px solid #f44336',
    borderRadius: '8px',
    color: '#c62828',
    fontSize: '14px',
  } as React.CSSProperties,
  loading: {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  } as React.CSSProperties,
};

const freshnessLabels: Record<string, string> = {
  fresh: 'Fresh',
  cached: 'Cached',
  stale: 'Stale',
  unavailable: 'Unavailable',
};

export function SlotSection({ slot, compactView, testId }: SlotSectionProps) {
  const timeHeader = `${slot.startTime} - ${slot.endTime}`;

  return (
    <div style={styles.container} data-testid={testId}>
      <div style={styles.header}>
        <span style={styles.timeRange}>{timeHeader}</span>
        {slot.dataFreshness && (
          <span style={styles.freshness}>
            {freshnessLabels[slot.dataFreshness] || slot.dataFreshness}
          </span>
        )}
      </div>

      {/* Error state */}
      {slot.error && (
        <div style={styles.error}>{slot.error}</div>
      )}

      {/* Loading state (only show if no error and actually loading) */}
      {slot.loading && !slot.error && (
        <div style={styles.loading as React.CSSProperties}>Loading...</div>
      )}

      {/* Content (show if not loading and no error) */}
      {!slot.loading && !slot.error && (
        compactView ? (
          <CompactAvailabilityBar
            availableCount={slot.availableCount}
            totalCount={slot.totalCount}
            testId={testId ? `${testId}-compact` : undefined}
          />
        ) : (
          <LaneGrid lanes={slot.lanes} />
        )
      )}
    </div>
  );
}
