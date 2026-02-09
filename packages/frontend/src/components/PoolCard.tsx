/**
 * PoolCard - Displays pool name, location, and lane count
 */

import type { SwimmingPool } from '@swim-check/shared';
import { Link } from 'react-router-dom';

interface PoolCardProps {
  pool: SwimmingPool;
  showDetails?: boolean;
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '12px',
    transition: 'box-shadow 0.2s',
  } as React.CSSProperties,
  cardHover: {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  name: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#1a1a1a',
  } as React.CSSProperties,
  location: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  } as React.CSSProperties,
  lanes: {
    fontSize: '14px',
    color: '#0066cc',
    fontWeight: 500,
  } as React.CSSProperties,
  link: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  } as React.CSSProperties,
};

export function PoolCard({ pool, showDetails = true }: PoolCardProps) {
  const content = (
    <div style={styles.card} className="pool-card-responsive">
      <div style={styles.name}>{pool.name}</div>
      <div style={styles.location}>{pool.location}</div>
      {showDetails && (
        <div style={styles.lanes}>
          {pool.totalLanes} lane{pool.totalLanes !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  return (
    <Link to={`/pools/${pool.id}`} style={styles.link}>
      {content}
    </Link>
  );
}
