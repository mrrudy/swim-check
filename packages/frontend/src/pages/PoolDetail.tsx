/**
 * PoolDetail page - Combines TimeSlotPicker and LaneGrid with API integration
 * Uses unified state management for synchronized time slot selection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { LaneGrid } from '../components/LaneGrid';
import { CompactAvailabilityBar } from '../components/CompactAvailabilityBar';
import { MultiSlotView } from '../components/MultiSlotView';
import { FavoriteButton } from '../components/FavoriteButton';
import { ViewOptionsBar } from '../components/ViewOptionsBar';
import { NavigableSlotDisplay } from '../components/NavigableSlotDisplay';
import { useSlotNavigation } from '../hooks/useSlotNavigation';
import { useTimeSlotState } from '../hooks/useTimeSlotState';
import { useDebounceRefresh } from '../hooks/useDebounceRefresh';
import { useViewPreferences } from '../hooks/useViewPreferences';
import { useMultiSlotData } from '../hooks/useMultiSlotData';
import { api } from '../services/api';
import type { SwimmingPool, LaneAvailability } from '@swim-check/shared';

type DataFreshness = 'fresh' | 'cached' | 'stale' | 'unavailable';

interface AvailabilityState {
  lanes: LaneAvailability[];
  dataFreshness: DataFreshness;
  scrapedAt?: string;
  availableLaneCount: number;
  totalLaneCount: number;
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    marginBottom: '24px',
  } as React.CSSProperties,
  backLink: {
    fontSize: '14px',
    color: '#0066cc',
    textDecoration: 'none',
    marginBottom: '12px',
    display: 'inline-block',
  } as React.CSSProperties,
  poolName: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
  } as React.CSSProperties,
  poolLocation: {
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,
  refreshButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as React.CSSProperties,
  refreshButtonDisabled: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
  } as React.CSSProperties,
  freshness: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  } as React.CSSProperties,
  freshnessIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  } as React.CSSProperties,
  error: {
    padding: '16px',
    backgroundColor: '#ffeaea',
    border: '1px solid #f44336',
    borderRadius: '8px',
    color: '#c62828',
    marginBottom: '16px',
  } as React.CSSProperties,
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
  // Focus styling now handled by NavigableSlotDisplay
  staleIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#856404',
    marginBottom: '16px',
  } as React.CSSProperties,
  unavailableIndicator: {
    padding: '12px 16px',
    backgroundColor: '#e8f4fd',
    border: '1px solid #90caf9',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#1565c0',
    marginBottom: '16px',
  } as React.CSSProperties,
  refreshingOverlay: {
    position: 'relative',
  } as React.CSSProperties,
  refreshingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '8px 16px',
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '14px',
    zIndex: 10,
  } as React.CSSProperties,
};

const freshnessColors: Record<DataFreshness, string> = {
  fresh: '#4caf50',
  cached: '#2196f3',
  stale: '#ff9800',
  unavailable: '#f44336',
};

const freshnessLabels: Record<DataFreshness, string> = {
  fresh: 'Fresh data',
  cached: 'From cache',
  stale: 'Stale data',
  unavailable: 'Unavailable',
};

export function PoolDetail() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<SwimmingPool | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  const [loadingPool, setLoadingPool] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  // hasFocus state now managed by NavigableSlotDisplay

  // View preferences (005-pool-view-options)
  const viewPreferences = useViewPreferences();

  // AbortController for canceling in-flight requests (FR-009)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Unified time slot state management - single source of truth
  const timeSlotState = useTimeSlotState();
  const { state, setDate, setStartTime, setEndTime, handleNavigation, isInitialized } = timeSlotState;

  // Multi-slot data hook (005-pool-view-options) - only used when forwardSlotCount > 1
  const multiSlotData = useMultiSlotData({
    poolId: poolId || '',
    date: state.date,
    startTime: state.startTime,
    duration: state.duration,
    forwardSlotCount: viewPreferences.forwardSlotCount,
  });

  // Slot navigation - controlled by unified state
  const navigation = useSlotNavigation({
    startTime: state.startTime,
    duration: state.duration,
    forwardSlotCount: viewPreferences.forwardSlotCount,
    onNavigate: handleNavigation,
  });

  // Fetch availability function with AbortController support
  const fetchAvailability = useCallback(
    async (forceRefresh = false) => {
      if (!poolId || !isInitialized) return;

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setError(null);

      try {
        const result = await api.getPoolAvailability(
          poolId,
          state.date,
          state.startTime,
          state.endTime,
          forceRefresh
        );

        // Check if this request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setAvailability({
          lanes: result.lanes,
          dataFreshness: result.dataFreshness,
          scrapedAt: result.scrapedAt,
          availableLaneCount: result.availableLaneCount,
          totalLaneCount: result.totalLaneCount,
        });
      } catch (err) {
        // Ignore abort errors
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setError((err as Error).message);
      }
    },
    [poolId, state.date, state.startTime, state.endTime, isInitialized]
  );

  // Debounced auto-refresh - triggers 2s after last time slot change
  const { isRefreshing, refreshNow } = useDebounceRefresh({
    timeSlotState: state,
    onRefresh: () => fetchAvailability(false),
    delay: 2000,
    isInitialized,
  });

  // Fetch pool details and check if favorite
  useEffect(() => {
    if (!poolId) return;

    setLoadingPool(true);
    setError(null);

    Promise.all([
      api.getPool(poolId),
      api.listFavorites(),
    ])
      .then(([poolData, favData]) => {
        setPool(poolData);
        setIsFavorite(favData.favorites.some((f) => f.pool.id === poolId));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPool(false));
  }, [poolId]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = () => {
    refreshNow();
  };

  if (loadingPool && !pool) {
    return <div style={styles.loading}>Loading pool...</div>;
  }

  if (error && !pool) {
    return (
      <div style={styles.container}>
        <Link to="/" style={styles.backLink}>
          ← Back
        </Link>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  const isLoading = loadingPool || isRefreshing;

  return (
    <div style={styles.container} className="pool-detail-content">
      <div style={styles.header}>
        <Link to="/" style={styles.backLink}>
          ← Back
        </Link>
        {pool && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <h1 style={{ ...styles.poolName, marginBottom: 0 }}>{pool.name}</h1>
              <FavoriteButton
                poolId={pool.id}
                isFavorite={isFavorite}
                onToggle={(fav) => setIsFavorite(fav)}
              />
            </div>
            <p style={styles.poolLocation}>{pool.location}</p>
          </>
        )}
      </div>

      {/* Time Slot Picker - controlled by unified state */}
      <TimeSlotPicker
        date={state.date}
        startTime={state.startTime}
        endTime={state.endTime}
        onDateChange={setDate}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        disabled={isLoading}
      />

      {/* Slot navigation + edge zone overlay (shared component) */}
      <NavigableSlotDisplay
        navigation={navigation}
        dataLoaded={availability !== null && !isRefreshing}
        showNav={viewPreferences.showNavEnabled}
      >
        <div style={styles.refreshingOverlay}>
          {(isRefreshing || multiSlotData.isLoading) && (
            <div style={styles.refreshingIndicator as React.CSSProperties}>
              Updating...
            </div>
          )}

          {/* Multi-slot view when forwardSlotCount > 1 */}
          {viewPreferences.forwardSlotCount > 1 ? (
            <MultiSlotView
              slots={multiSlotData.slots}
              compactView={viewPreferences.compactViewEnabled}
              date={state.date}
              testId="multi-slot-view"
            />
          ) : (
            /* Single slot view (original behavior) */
            availability && (
              viewPreferences.compactViewEnabled ? (
                <CompactAvailabilityBar
                  availableCount={availability.availableLaneCount}
                  totalCount={availability.totalLaneCount}
                  loading={isRefreshing}
                  testId="pool-availability-bar"
                />
              ) : (
                <LaneGrid lanes={availability.lanes} loading={isRefreshing} />
              )
            )
          )}
        </div>
      </NavigableSlotDisplay>

      {/* View Options */}
      <ViewOptionsBar viewPreferences={viewPreferences} />

      {/* Refresh and status */}
      <div style={styles.actions} className="pool-detail-actions">
        <button
          onClick={handleRefresh}
          style={isLoading ? styles.refreshButtonDisabled : styles.refreshButton}
          disabled={isLoading}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        {availability && (
          <div style={styles.freshness}>
            <div
              style={{
                ...styles.freshnessIndicator,
                backgroundColor: freshnessColors[availability.dataFreshness],
              }}
            />
            <span>{freshnessLabels[availability.dataFreshness]}</span>
            {availability.scrapedAt && (
              <span style={{ color: '#999' }}>
                ({new Date(availability.scrapedAt).toLocaleTimeString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Unavailable data indicator */}
      {availability?.dataFreshness === 'unavailable' && (
        <div style={styles.unavailableIndicator} className="unavailable-indicator">
          <span>No availability data yet for this pool. Data will appear after the next scheduled scrape. You can also try clicking Refresh.</span>
        </div>
      )}

      {/* Stale data indicator */}
      {availability?.dataFreshness === 'stale' && (
        <div style={styles.staleIndicator} className="stale-indicator">
          <span>Data may be outdated. Click Refresh for latest availability.</span>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}
