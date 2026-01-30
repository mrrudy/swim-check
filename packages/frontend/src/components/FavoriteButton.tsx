/**
 * FavoriteButton - Toggle button for adding/removing pools from favorites
 */

import { useState } from 'react';
import { api } from '../services/api';

interface FavoriteButtonProps {
  poolId: string;
  isFavorite: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

const styles = {
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,
  favorite: {
    backgroundColor: '#ffeaea',
    color: '#c62828',
  } as React.CSSProperties,
  notFavorite: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  } as React.CSSProperties,
  loading: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  star: {
    fontSize: '16px',
  } as React.CSSProperties,
};

export function FavoriteButton({ poolId, isFavorite, onToggle }: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentFavorite, setCurrentFavorite] = useState(isFavorite);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (currentFavorite) {
        await api.removeFavorite(poolId);
        setCurrentFavorite(false);
        onToggle?.(false);
      } else {
        await api.addFavorite(poolId);
        setCurrentFavorite(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        ...styles.button,
        ...(currentFavorite ? styles.favorite : styles.notFavorite),
        ...(loading ? styles.loading : {}),
      }}
    >
      <span style={styles.star}>{currentFavorite ? '★' : '☆'}</span>
      {loading ? 'Saving...' : currentFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    </button>
  );
}
