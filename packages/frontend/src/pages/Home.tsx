/**
 * Home page - Displays favorite pools prominently
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PoolCard } from '../components/PoolCard';
import { api } from '../services/api';
import type { SwimmingPool } from '@swim-check/shared';

interface FavoriteItem {
  pool: SwimmingPool;
  addedAt: string;
  displayOrder: number;
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  } as React.CSSProperties,
  section: {
    marginBottom: '32px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#666',
  } as React.CSSProperties,
  emptyStateText: {
    marginBottom: '16px',
  } as React.CSSProperties,
  link: {
    color: '#0066cc',
    textDecoration: 'none',
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
  favoritesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  draggable: {
    cursor: 'grab',
  } as React.CSSProperties,
  dragging: {
    opacity: 0.5,
    cursor: 'grabbing',
  } as React.CSSProperties,
};

export function Home() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.listFavorites();
      setFavorites(result.favorites);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFavorites = [...favorites];
    const draggedItem = newFavorites[draggedIndex];
    newFavorites.splice(draggedIndex, 1);
    newFavorites.splice(index, 0, draggedItem);

    setFavorites(newFavorites);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    // Save the new order
    try {
      const order = favorites.map((f) => f.pool.id);
      await api.reorderFavorites(order);
    } catch (err) {
      console.error('Failed to save order:', err);
      // Refresh to get the actual order
      fetchFavorites();
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading favorites...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span>★</span> Your Favorite Pools
        </h2>

        {error && <div style={styles.error}>{error}</div>}

        {favorites.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>You haven't added any favorite pools yet.</p>
            <Link to="/search" style={styles.link}>
              Search for pools to add to your favorites →
            </Link>
          </div>
        ) : (
          <div style={styles.favoritesList}>
            {favorites.map((fav, index) => (
              <div
                key={fav.pool.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  ...styles.draggable,
                  ...(draggedIndex === index ? styles.dragging : {}),
                }}
              >
                <PoolCard pool={fav.pool} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <Link to="/search" style={styles.link}>
          Browse all pools →
        </Link>
      </div>
    </div>
  );
}
