/**
 * ViewOptionsBar - Shared view options UI for both PoolDetail and Home pages
 * 009-mobile-ui-refinements
 *
 * Provides compact/detailed toggle, slots ahead selector, and show nav toggle.
 */

import React from 'react';
import type { UseViewPreferencesReturn } from '../hooks/useViewPreferences';

export interface ViewOptionsBarProps {
  viewPreferences: UseViewPreferencesReturn;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  button: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  buttonActive: {
    backgroundColor: '#0066cc',
    color: '#fff',
    borderColor: '#0066cc',
  } as React.CSSProperties,
  buttonInactive: {
    backgroundColor: '#fff',
    color: '#333',
  } as React.CSSProperties,
  label: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  forwardSlotSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: 'auto',
  } as React.CSSProperties,
  select: {
    padding: '4px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  } as React.CSSProperties,
};

export function ViewOptionsBar({ viewPreferences }: ViewOptionsBarProps) {
  return (
    <div style={styles.container}>
      <div style={styles.toggle}>
        <span style={styles.label}>View:</span>
        <button
          style={{
            ...styles.button,
            ...(viewPreferences.compactViewEnabled
              ? styles.buttonActive
              : styles.buttonInactive),
          }}
          onClick={() => viewPreferences.setCompactViewEnabled(true)}
        >
          Compact
        </button>
        <button
          style={{
            ...styles.button,
            ...(!viewPreferences.compactViewEnabled
              ? styles.buttonActive
              : styles.buttonInactive),
          }}
          onClick={() => viewPreferences.setCompactViewEnabled(false)}
        >
          Detailed
        </button>
      </div>

      {/* Show nav toggle */}
      <div style={styles.toggle}>
        <button
          style={{
            ...styles.button,
            ...(viewPreferences.showNavEnabled
              ? styles.buttonActive
              : styles.buttonInactive),
          }}
          onClick={() => viewPreferences.setShowNavEnabled(!viewPreferences.showNavEnabled)}
        >
          Show Nav
        </button>
      </div>

      {/* Forward slot count selector */}
      <div style={styles.forwardSlotSelector}>
        <span style={styles.label}>Slots ahead:</span>
        <select
          style={styles.select}
          value={viewPreferences.forwardSlotCount}
          onChange={(e) =>
            viewPreferences.setForwardSlotCount(parseInt(e.target.value, 10))
          }
          disabled={viewPreferences.isLoading || viewPreferences.isSaving}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {viewPreferences.isSaving && (
          <span style={{ fontSize: '12px', color: '#666' }}>Saving...</span>
        )}
      </div>
    </div>
  );
}
