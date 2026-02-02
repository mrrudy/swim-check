/**
 * Database queries for scrape job tracking (003-midnight-rescrape)
 */

import { getDatabase, saveDatabase } from './schema.js';
import type { ScrapeJob } from '@swim-check/shared';

export interface ScrapeJobRow {
  pool_id: string;
  last_scrape_date: string | null;
  last_scrape_timestamp: string | null;
  last_scrape_status: 'success' | 'failure' | null;
  last_error_message: string | null;
}

function rowToScrapeJob(row: ScrapeJobRow): ScrapeJob {
  return {
    poolId: row.pool_id,
    lastScrapeDate: row.last_scrape_date,
    lastScrapeTimestamp: row.last_scrape_timestamp ? new Date(row.last_scrape_timestamp) : null,
    lastScrapeStatus: row.last_scrape_status,
    lastErrorMessage: row.last_error_message,
  };
}

/**
 * Get scrape job for a specific pool
 */
export function getScrapeJob(poolId: string): ScrapeJob | null {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM scrape_jobs WHERE pool_id = ?', [poolId]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });

  return rowToScrapeJob(obj as unknown as ScrapeJobRow);
}

/**
 * Get all scrape jobs
 */
export function getAllScrapeJobs(): ScrapeJob[] {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM scrape_jobs');

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return rowToScrapeJob(obj as unknown as ScrapeJobRow);
  });
}

/**
 * Get pools that need scraping today
 * Returns pools where:
 * - No scrape job record exists
 * - Last scrape date is before today
 * - Last scrape status was failure
 */
export function getPoolsNeedingScrapeToday(todayDate: string): string[] {
  const db = getDatabase();
  const result = db.exec(
    `SELECT p.id
     FROM swimming_pools p
     LEFT JOIN scrape_jobs sj ON p.id = sj.pool_id
     WHERE sj.last_scrape_date IS NULL
        OR sj.last_scrape_date < ?
        OR sj.last_scrape_status = 'failure'`,
    [todayDate]
  );

  if (!result[0]) {
    return [];
  }

  return result[0].values.map((row) => row[0] as string);
}

/**
 * Insert or update scrape job record
 */
export function upsertScrapeJob(job: ScrapeJob): void {
  const db = getDatabase();

  db.run(
    `INSERT OR REPLACE INTO scrape_jobs
     (pool_id, last_scrape_date, last_scrape_timestamp, last_scrape_status, last_error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [
      job.poolId,
      job.lastScrapeDate,
      job.lastScrapeTimestamp?.toISOString() ?? null,
      job.lastScrapeStatus,
      job.lastErrorMessage,
    ]
  );
  saveDatabase();
}

/**
 * Update scrape job with success status
 */
export function markScrapeSuccess(poolId: string, date: string): void {
  upsertScrapeJob({
    poolId,
    lastScrapeDate: date,
    lastScrapeTimestamp: new Date(),
    lastScrapeStatus: 'success',
    lastErrorMessage: null,
  });
}

/**
 * Update scrape job with failure status
 */
export function markScrapeFailure(poolId: string, date: string, errorMessage: string): void {
  upsertScrapeJob({
    poolId,
    lastScrapeDate: date,
    lastScrapeTimestamp: new Date(),
    lastScrapeStatus: 'failure',
    lastErrorMessage: errorMessage,
  });
}
