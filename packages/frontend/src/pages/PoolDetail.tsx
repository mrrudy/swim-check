/**
 * PoolDetail page - Combines TimeSlotPicker and LaneGrid with API integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { LaneGrid } from '../components/LaneGrid';
import { FavoriteButton } from '../components/FavoriteButton';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeParams, setTimeParams] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch pool details and check if favorite
  useEffect(() => {
    if (!poolId) return;

    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [poolId]);

  // Fetch availability when time params change
  const fetchAvailability = useCallback(
    async (forceRefresh = false) => {
      if (!poolId || !timeParams) return;

      setLoading(true);
      setError(null);

      try {
        const result = await api.getPoolAvailability(
          poolId,
          timeParams.date,
          timeParams.startTime,
          timeParams.endTime,
          forceRefresh
        );

        setAvailability({
          lanes: result.lanes,
          dataFreshness: result.dataFreshness,
          scrapedAt: result.scrapedAt,
          availableLaneCount: result.availableLaneCount,
          totalLaneCount: result.totalLaneCount,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [poolId, timeParams]
  );

  useEffect(() => {
    if (timeParams) {
      fetchAvailability();
    }
  }, [fetchAvailability, timeParams]);

  const handleTimeChange = useCallback((date: string, startTime: string, endTime: string) => {
    setTimeParams({ date, startTime, endTime });
  }, []);

  const handleRefresh = () => {
    fetchAvailability(true);
  };

  if (loading && !pool) {
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

  return (
    <div style={styles.container}>
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

      <TimeSlotPicker onChange={handleTimeChange} />

      <div style={styles.actions}>
        <button onClick={handleRefresh} style={styles.refreshButton} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
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

      {error && <div style={styles.error}>{error}</div>}

      {availability && <LaneGrid lanes={availability.lanes} loading={loading} />}
    </div>
  );
}
