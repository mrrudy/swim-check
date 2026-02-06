/**
 * MultiSlotView - Displays multiple consecutive time slots stacked vertically
 * 005-pool-view-options
 */

import { SlotSection } from './SlotSection';
import type { SlotData } from './SlotSection';

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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  empty: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  } as React.CSSProperties,
};

export function MultiSlotView({ slots, compactView, date, testId }: MultiSlotViewProps) {
  if (slots.length === 0) {
    return (
      <div style={styles.container} data-testid={testId}>
        <div style={styles.empty as React.CSSProperties}>
          No slots to display
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} data-testid={testId}>
      {slots.map((slot, index) => (
        <SlotSection
          key={`${date}-${slot.startTime}-${slot.endTime}`}
          slot={slot}
          compactView={compactView}
          testId={testId ? `${testId}-slot-${index}` : undefined}
        />
      ))}
    </div>
  );
}

// Re-export SlotData type for convenience
export type { SlotData };
