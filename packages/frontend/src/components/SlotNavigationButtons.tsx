/**
 * SlotNavigationButtons - UI buttons for slot navigation and duration adjustment
 */

import React from 'react';
import { KeyboardHints } from './KeyboardHints';

export interface SlotNavigationButtonsProps {
  // Current state (display)
  startTime: string;
  endTime: string;
  duration: number;

  // Navigation boundaries
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;

  // Callbacks
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onExtend: () => void;
  onReduce: () => void;

  // Optional
  showKeyboardHints?: boolean;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  } as React.CSSProperties,
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minWidth: '80px',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#f0f0f0',
  } as React.CSSProperties,
  display: {
    padding: '8px 16px',
    fontSize: '16px',
    fontWeight: 600,
    minWidth: '100px',
    textAlign: 'center',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: '4px',
  } as React.CSSProperties,
  displayGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,
  hints: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
    marginTop: '8px',
  } as React.CSSProperties,
};

function formatDuration(durationMins: number): string {
  const hours = Math.floor(durationMins / 60);
  const minutes = durationMins % 60;

  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function SlotNavigationButtons({
  startTime,
  endTime,
  duration,
  canNavigatePrevious,
  canNavigateNext,
  canExtend,
  canReduce,
  onNavigatePrevious,
  onNavigateNext,
  onExtend,
  onReduce,
  showKeyboardHints = true,
}: SlotNavigationButtonsProps) {
  return (
    <div style={styles.container} className="slot-nav-container">
      {/* Time navigation row */}
      <div style={styles.row}>
        <button
          type="button"
          onClick={onNavigatePrevious}
          disabled={!canNavigatePrevious}
          style={{
            ...styles.button,
            ...(!canNavigatePrevious ? styles.buttonDisabled : {}),
          }}
          aria-label="Previous slot"
          className="slot-nav-button"
        >
          ◀ Prev
        </button>

        <div style={styles.displayGroup}>
          <span style={styles.label}>Start</span>
          <span style={styles.display}>{startTime}</span>
        </div>

        <button
          type="button"
          onClick={onNavigateNext}
          disabled={!canNavigateNext}
          style={{
            ...styles.button,
            ...(!canNavigateNext ? styles.buttonDisabled : {}),
          }}
          aria-label="Next slot"
          className="slot-nav-button"
        >
          Next ▶
        </button>
      </div>

      {/* Duration adjustment row */}
      <div style={styles.row}>
        <button
          type="button"
          onClick={onReduce}
          disabled={!canReduce}
          style={{
            ...styles.button,
            ...(!canReduce ? styles.buttonDisabled : {}),
          }}
          aria-label="Reduce duration by 30 minutes"
          className="slot-nav-button"
        >
          ▲ -30m
        </button>

        <div style={styles.displayGroup}>
          <span style={styles.label}>Duration</span>
          <span style={styles.display}>{formatDuration(duration)}</span>
        </div>

        <button
          type="button"
          onClick={onExtend}
          disabled={!canExtend}
          style={{
            ...styles.button,
            ...(!canExtend ? styles.buttonDisabled : {}),
          }}
          aria-label="Extend duration by 30 minutes"
          className="slot-nav-button"
        >
          +30m ▼
        </button>
      </div>

      {/* End time display */}
      <div style={styles.row}>
        <div style={styles.displayGroup}>
          <span style={styles.label}>End Time</span>
          <span style={{ ...styles.display, fontSize: '14px', fontWeight: 400 }}>
            {endTime}
          </span>
        </div>
      </div>

      {/* Keyboard hints */}
      {showKeyboardHints && <KeyboardHints />}
    </div>
  );
}
