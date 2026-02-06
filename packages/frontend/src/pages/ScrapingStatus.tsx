/**
 * Scraping Status page component (006-scraping-status-view)
 * Displays the last scraping status for each configured swimming pool
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  formatScrapedAt,
  getStatusType,
  getStatusText,
  type ScrapingStatusType,
} from '../utils/formatTime';
import type { SchedulerStatusResponse, PoolScrapeStatusResponse, SourceLink } from '@swim-check/shared';

const styles = {
  container: {
    maxWidth: '800px',
  } as React.CSSProperties,
  header: {
    marginBottom: '24px',
  } as React.CSSProperties,
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,
  loading: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#666',
  } as React.CSSProperties,
  error: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    color: '#b91c1c',
    marginBottom: '16px',
  } as React.CSSProperties,
  errorText: {
    margin: '0 0 12px 0',
  } as React.CSSProperties,
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  poolList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  } as React.CSSProperties,
  poolCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  } as React.CSSProperties,
  poolHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  } as React.CSSProperties,
  poolName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  timestamp: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  errorMessage: {
    fontSize: '13px',
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    padding: '8px 12px',
    borderRadius: '4px',
    margin: '8px 0',
    fontFamily: 'monospace',
    wordBreak: 'break-word' as const,
  } as React.CSSProperties,
  sourceLinks: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  } as React.CSSProperties,
  sourceLinksTitle: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 8px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  sourceLink: {
    display: 'inline-block',
    marginRight: '16px',
    marginBottom: '4px',
    fontSize: '13px',
    color: '#0066cc',
    textDecoration: 'none',
  } as React.CSSProperties,
  noSourceLinks: {
    fontSize: '13px',
    color: '#9ca3af',
    fontStyle: 'italic' as const,
  } as React.CSSProperties,
  emptyState: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#666',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  } as React.CSSProperties,
};

// Status badge colors
const statusColors: Record<ScrapingStatusType, { bg: string; text: string }> = {
  success: { bg: '#dcfce7', text: '#166534' },
  stale: { bg: '#fef3c7', text: '#92400e' },
  failed: { bg: '#fef2f2', text: '#b91c1c' },
  never: { bg: '#f3f4f6', text: '#6b7280' },
  'in-progress': { bg: '#dbeafe', text: '#1e40af' },
};

interface PoolStatusCardProps {
  pool: PoolScrapeStatusResponse;
}

function PoolStatusCard({ pool }: PoolStatusCardProps) {
  const statusType = getStatusType(
    pool.lastScrapeStatus,
    pool.lastScrapeTimestamp,
    pool.inProgress
  );
  const statusText = getStatusText(statusType);
  const colors = statusColors[statusType];

  return (
    <div style={styles.poolCard}>
      <div style={styles.poolHeader}>
        <h3 style={styles.poolName}>{pool.poolName}</h3>
        <span
          style={{
            ...styles.badge,
            backgroundColor: colors.bg,
            color: colors.text,
          }}
        >
          {statusText}
        </span>
      </div>

      <p style={styles.timestamp}>
        Last scraped: {formatScrapedAt(pool.lastScrapeTimestamp)}
      </p>

      {/* Show error message for failed scrapes */}
      {statusType === 'failed' && pool.lastErrorMessage && (
        <div style={styles.errorMessage}>{pool.lastErrorMessage}</div>
      )}

      {/* Source links section */}
      <div style={styles.sourceLinks}>
        <p style={styles.sourceLinksTitle}>Source Links</p>
        {pool.sourceUrls.length > 0 ? (
          pool.sourceUrls.map((link: SourceLink, index: number) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.sourceLink}
            >
              {link.label}
            </a>
          ))
        ) : (
          <span style={styles.noSourceLinks}>No source links configured</span>
        )}
      </div>
    </div>
  );
}

export function ScrapingStatus() {
  const [status, setStatus] = useState<SchedulerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScrapingStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scraping status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Scraping Status</h2>
        <p style={styles.subtitle}>
          View the last scraping status for each configured swimming pool
        </p>
      </header>

      {/* Loading state */}
      {loading && <div style={styles.loading}>Loading scraping status...</div>}

      {/* Error state with retry */}
      {error && !loading && (
        <div style={styles.error}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryButton} onClick={fetchStatus}>
            Retry
          </button>
        </div>
      )}

      {/* Pool list */}
      {!loading && !error && status && (
        <>
          {status.poolStatuses.length === 0 ? (
            <div style={styles.emptyState}>
              No pools configured with scrapers
            </div>
          ) : (
            <div style={styles.poolList}>
              {status.poolStatuses.map((pool) => (
                <PoolStatusCard key={pool.poolId} pool={pool} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
