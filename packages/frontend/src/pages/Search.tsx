/**
 * Search page - Pool search input and PoolCard list
 */

import { useState, useEffect } from 'react';
import { PoolCard } from '../components/PoolCard';
import { api } from '../services/api';
import type { SwimmingPool } from '@swim-check/shared';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  } as React.CSSProperties,
  searchContainer: {
    marginBottom: '24px',
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  results: {
    marginTop: '16px',
  } as React.CSSProperties,
  resultCount: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  } as React.CSSProperties,
  noResults: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
  error: {
    padding: '16px',
    backgroundColor: '#ffeaea',
    border: '1px solid #f44336',
    borderRadius: '8px',
    color: '#c62828',
  } as React.CSSProperties,
};

export function Search() {
  const [search, setSearch] = useState('');
  const [pools, setPools] = useState<SwimmingPool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.listPools(search || undefined);
        setPools(result.pools);
        setTotal(result.total);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchPools, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div style={styles.container}>
      <h1>Search Pools</h1>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Searching...</div>
      ) : pools.length === 0 ? (
        <div style={styles.noResults}>
          {search ? 'No pools found matching your search' : 'No pools available'}
        </div>
      ) : (
        <div style={styles.results}>
          <div style={styles.resultCount}>
            {total} pool{total !== 1 ? 's' : ''} found
          </div>
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}
