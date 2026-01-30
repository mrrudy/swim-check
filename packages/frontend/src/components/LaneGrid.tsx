/**
 * LaneGrid - Displays lane availability with visual indicators
 */

import type { LaneAvailability } from '@swim-check/shared';

interface LaneGridProps {
  lanes: LaneAvailability[];
  loading?: boolean;
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px',
    padding: '16px 0',
  } as React.CSSProperties,
  lane: {
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    transition: 'transform 0.2s',
  } as React.CSSProperties,
  available: {
    backgroundColor: '#e6f7e6',
    border: '2px solid #4caf50',
    color: '#2e7d32',
  } as React.CSSProperties,
  booked: {
    backgroundColor: '#ffeaea',
    border: '2px solid #f44336',
    color: '#c62828',
  } as React.CSSProperties,
  laneNumber: {
    fontSize: '24px',
    fontWeight: 700,
  } as React.CSSProperties,
  laneLabel: {
    fontSize: '12px',
    marginTop: '4px',
  } as React.CSSProperties,
  status: {
    fontSize: '12px',
    marginTop: '8px',
    fontWeight: 500,
  } as React.CSSProperties,
  summary: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  } as React.CSSProperties,
  loading: {
    opacity: 0.6,
  } as React.CSSProperties,
};

export function LaneGrid({ lanes, loading = false }: LaneGridProps) {
  const availableCount = lanes.filter((l) => l.isAvailable).length;
  const totalCount = lanes.length;

  if (lanes.length === 0) {
    return <div style={styles.summary}>No lane data available</div>;
  }

  return (
    <div style={loading ? styles.loading : undefined}>
      <div style={styles.summary}>
        {availableCount} of {totalCount} lane{totalCount !== 1 ? 's' : ''} available
      </div>
      <div style={styles.grid}>
        {lanes.map((lane) => (
          <div
            key={lane.laneId}
            style={{
              ...styles.lane,
              ...(lane.isAvailable ? styles.available : styles.booked),
            }}
          >
            <div style={styles.laneNumber}>{lane.laneNumber}</div>
            {lane.label && <div style={styles.laneLabel}>{lane.label}</div>}
            <div style={styles.status}>{lane.isAvailable ? 'Available' : 'Booked'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
