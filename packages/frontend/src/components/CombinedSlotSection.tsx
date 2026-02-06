/**
 * CombinedSlotSection - Displays availability for multiple pools in a single time slot
 * 007-favorites-combined-view
 *
 * T009: Component skeleton
 * T010: Time slot header rendering
 * T011: Pool name and freshness badge rendering
 * T012: CompactAvailabilityBar display
 * T013: LaneGrid display
 * T014: Loading, error, and unavailable state handling
 * T015: allFailed message display
 * T016: Styles
 */

import React from 'react';
import { CompactAvailabilityBar } from './CompactAvailabilityBar';
import { LaneGrid } from './LaneGrid';
import type { CombinedSlotData, DataFreshness } from '../types/views';
import './CombinedSlotSection.css';

export interface CombinedSlotSectionProps {
  /** Slot data with all favorites */
  slot: CombinedSlotData;
  /** Whether to display compact (bar) or detailed (lane grid) view */
  compactView: boolean;
}

/**
 * Get CSS class for freshness badge
 */
function getFreshnessBadgeClass(freshness: DataFreshness): string {
  switch (freshness) {
    case 'fresh':
      return 'freshness-badge freshness-fresh';
    case 'cached':
      return 'freshness-badge freshness-cached';
    case 'stale':
      return 'freshness-badge freshness-stale';
    case 'unavailable':
      return 'freshness-badge freshness-unavailable';
    default:
      return 'freshness-badge';
  }
}

/**
 * Format freshness label for display
 */
function formatFreshnessLabel(freshness: DataFreshness): string {
  switch (freshness) {
    case 'fresh':
      return 'Fresh';
    case 'cached':
      return 'Cached';
    case 'stale':
      return 'Stale';
    case 'unavailable':
      return 'Unavailable';
    default:
      return '';
  }
}

export function CombinedSlotSection({ slot, compactView }: CombinedSlotSectionProps) {
  return (
    <section className="combined-slot-section">
      {/* T010: Time slot header */}
      <h3 className="slot-header">{slot.header}</h3>

      {/* T015: allFailed message */}
      {slot.allFailed && (
        <p className="all-failed-message">No availability data for any pools</p>
      )}

      {/* Pool availability rows */}
      {!slot.allFailed &&
        slot.favorites.map((fav) => (
          <div key={fav.pool.id} className="favorite-pool-row">
            {/* T011: Pool name and freshness badge */}
            <div className="pool-name-row">
              <span className="pool-name">{fav.pool.name}</span>
              {fav.status === 'loaded' && fav.dataFreshness !== 'fresh' && (
                <span className={getFreshnessBadgeClass(fav.dataFreshness)}>
                  {formatFreshnessLabel(fav.dataFreshness)}
                </span>
              )}
            </div>

            {/* T014: Loading state */}
            {fav.status === 'loading' && (
              <div className="loading-indicator">Loading...</div>
            )}

            {/* T014: Error state */}
            {fav.status === 'error' && (
              <div className="error-message">{fav.error || 'Failed to load'}</div>
            )}

            {/* T014: Unavailable state */}
            {fav.status === 'unavailable' && (
              <div className="unavailable-message">Data unavailable</div>
            )}

            {/* T012: Compact view with availability bar */}
            {fav.status === 'loaded' && compactView && (
              <CompactAvailabilityBar
                availableCount={fav.availableCount}
                totalCount={fav.totalCount}
              />
            )}

            {/* T013: Detailed view with lane grid */}
            {fav.status === 'loaded' && !compactView && (
              <LaneGrid lanes={fav.lanes} />
            )}
          </div>
        ))}
    </section>
  );
}
