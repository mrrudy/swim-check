/**
 * Timestamp formatting utilities for Scraping Status View (006-scraping-status-view)
 */

const STALE_THRESHOLD_HOURS = 24;

/**
 * Format a scrape timestamp as a human-readable string.
 * Uses relative time for recent timestamps (<48 hours), absolute for older ones.
 */
export function formatScrapedAt(timestamp: string | null): string {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Use relative time for recent (<48 hours), absolute for older
  if (diffHours < 48) {
    return formatRelativeTime(date);
  }

  return formatAbsoluteTime(date);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffMs = Date.now() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return rtf.format(-minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');

  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

/**
 * Format a date as absolute time (e.g., "Jan 15, 2026 14:30")
 */
function formatAbsoluteTime(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Status types for visual indicators
 */
export type ScrapingStatusType = 'success' | 'stale' | 'failed' | 'never' | 'in-progress';

/**
 * Determine the display status type based on scrape status and timestamp.
 * Used for color-coded status badges.
 */
export function getStatusType(
  lastScrapeStatus: 'success' | 'failure' | null,
  lastScrapeTimestamp: string | null,
  inProgress: boolean
): ScrapingStatusType {
  if (inProgress) return 'in-progress';
  if (!lastScrapeStatus) return 'never';
  if (lastScrapeStatus === 'failure') return 'failed';

  // Check staleness for successful scrapes
  if (lastScrapeTimestamp) {
    const lastScrape = new Date(lastScrapeTimestamp);
    const hoursSince = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= STALE_THRESHOLD_HOURS) return 'stale';
  }

  return 'success';
}

/**
 * Get display text for a status type
 */
export function getStatusText(statusType: ScrapingStatusType): string {
  switch (statusType) {
    case 'success':
      return 'Success';
    case 'stale':
      return 'Stale';
    case 'failed':
      return 'Failed';
    case 'never':
      return 'Never scraped';
    case 'in-progress':
      return 'Scraping...';
  }
}
