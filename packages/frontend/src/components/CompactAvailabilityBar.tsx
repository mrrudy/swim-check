/**
 * CompactAvailabilityBar - Displays lane availability as a color-coded percentage bar
 * Shows "X of Y available" with a progress bar that fills proportionally
 * 005-pool-view-options
 */

import { calculateAvailabilityColor } from '../utils/colorUtils';

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

const styles = {
  container: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  containerLoading: {
    opacity: 0.6,
  } as React.CSSProperties,
  textRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  } as React.CSSProperties,
  availabilityText: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
  percentageText: {
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  barContainer: {
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
  } as React.CSSProperties,
  barFill: {
    height: '100%',
    borderRadius: '12px',
    transition: 'width 0.3s ease, background-color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    padding: '8px',
  } as React.CSSProperties,
};

export function CompactAvailabilityBar({
  availableCount,
  totalCount,
  loading = false,
  testId,
}: CompactAvailabilityBarProps) {
  // Calculate percentage (handle edge case of 0 total)
  const percentage = totalCount > 0 ? Math.min(1, availableCount / totalCount) : 0;
  const percentageDisplay = Math.round(percentage * 100);

  // Get color based on availability percentage
  const color = calculateAvailabilityColor(percentage);

  const containerStyle = {
    ...styles.container,
    ...(loading ? styles.containerLoading : {}),
  };

  // T030: Handle edge case of 0 lanes
  if (totalCount === 0) {
    return (
      <div style={containerStyle} data-testid={testId}>
        <div style={styles.emptyState as React.CSSProperties}>
          No lane data available
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid={testId}>
      <div style={styles.textRow}>
        <span style={styles.availabilityText}>
          {availableCount} of {totalCount} available
        </span>
        <span style={styles.percentageText}>{percentageDisplay}%</span>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barFill,
            width: `${percentage * 100}%`,
            backgroundColor: color.background,
          }}
          data-testid={testId ? `${testId}-fill` : undefined}
        />
      </div>
    </div>
  );
}
