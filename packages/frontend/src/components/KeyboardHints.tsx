/**
 * KeyboardHints - Display keyboard shortcut hints for slot navigation
 */

import React from 'react';

export interface KeyboardHintsProps {
  /** Show navigation hints */
  showNavigation?: boolean;

  /** Show duration hints */
  showDuration?: boolean;

  /** Compact layout */
  compact?: boolean;
}

const styles = {
  container: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
  } as React.CSSProperties,
  compact: {
    fontSize: '11px',
  } as React.CSSProperties,
};

export function KeyboardHints({
  showNavigation = true,
  showDuration = true,
  compact = false,
}: KeyboardHintsProps) {
  if (compact) {
    const hints: string[] = [];
    if (showNavigation) hints.push('←→');
    if (showDuration) hints.push('↑↓');
    return (
      <div style={{ ...styles.container, ...styles.compact }}>
        {hints.join(' ')}
      </div>
    );
  }

  const hints: string[] = [];
  if (showNavigation) hints.push('← → navigate slots');
  if (showDuration) hints.push('↑ ↓ adjust duration');

  return (
    <div style={styles.container}>
      {hints.join(' | ')}
    </div>
  );
}
