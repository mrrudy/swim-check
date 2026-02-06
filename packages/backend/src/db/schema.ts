/**
 * Database schema and initialization for SQLite using sql.js
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';

let db: SqlJsDatabase | null = null;
let dbPath: string = '';

const SCHEMA = `
-- Swimming pools
CREATE TABLE IF NOT EXISTS swimming_pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    website_url TEXT NOT NULL,
    total_lanes INTEGER NOT NULL CHECK (total_lanes > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lanes within pools
CREATE TABLE IF NOT EXISTS lanes (
    id TEXT PRIMARY KEY,
    pool_id TEXT NOT NULL REFERENCES swimming_pools(id) ON DELETE CASCADE,
    lane_number INTEGER NOT NULL CHECK (lane_number > 0),
    label TEXT,
    UNIQUE (pool_id, lane_number)
);

-- Lane bookings (scraped data)
CREATE TABLE IF NOT EXISTS lane_bookings (
    lane_id TEXT NOT NULL REFERENCES lanes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_booked INTEGER NOT NULL DEFAULT 0,
    scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (lane_id, date, start_time),
    CHECK (start_time < end_time)
);

-- Pool scraper metadata
CREATE TABLE IF NOT EXISTS pool_scrapers (
    pool_id TEXT PRIMARY KEY REFERENCES swimming_pools(id) ON DELETE CASCADE,
    scraper_type TEXT NOT NULL,
    version TEXT NOT NULL,
    last_health_check TEXT,
    is_healthy INTEGER NOT NULL DEFAULT 1
);

-- User preferences (single user for MVP)
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    slot_duration_mins INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration_mins >= 30 AND slot_duration_mins <= 480),
    compact_view_enabled INTEGER NOT NULL DEFAULT 1,
    forward_slot_count INTEGER NOT NULL DEFAULT 1 CHECK (forward_slot_count >= 1 AND forward_slot_count <= 10),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Favorite pools
CREATE TABLE IF NOT EXISTS favorite_pools (
    preference_id TEXT NOT NULL REFERENCES user_preferences(id) ON DELETE CASCADE,
    pool_id TEXT NOT NULL REFERENCES swimming_pools(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (preference_id, pool_id)
);

-- Generic cache
CREATE TABLE IF NOT EXISTS cache_entries (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scrape job tracking
CREATE TABLE IF NOT EXISTS scrape_jobs (
    pool_id TEXT PRIMARY KEY REFERENCES swimming_pools(id) ON DELETE CASCADE,
    last_scrape_date TEXT,
    last_scrape_timestamp TEXT,
    last_scrape_status TEXT CHECK(last_scrape_status IN ('success', 'failure')),
    last_error_message TEXT,
    resolved_source_urls TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lane_bookings_date ON lane_bookings(date);
CREATE INDEX IF NOT EXISTS idx_lane_bookings_pool_date ON lane_bookings(lane_id, date);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_favorite_pools_order ON favorite_pools(preference_id, display_order);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_date ON scrape_jobs(last_scrape_date);
`;

// Migrations for existing databases (003-midnight-rescrape)
const MIGRATIONS = `
-- Add scrape_jobs table if it doesn't exist (003-midnight-rescrape)
CREATE TABLE IF NOT EXISTS scrape_jobs (
    pool_id TEXT PRIMARY KEY REFERENCES swimming_pools(id) ON DELETE CASCADE,
    last_scrape_date TEXT,
    last_scrape_timestamp TEXT,
    last_scrape_status TEXT CHECK(last_scrape_status IN ('success', 'failure')),
    last_error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_date ON scrape_jobs(last_scrape_date);

-- Add view preferences columns if they don't exist (005-pool-view-options)
-- SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we use a workaround
-- Check if columns exist via PRAGMA, then add if missing (handled in code)
`;

/**
 * Migration for view preferences columns (005-pool-view-options)
 * Adds compact_view_enabled and forward_slot_count columns if they don't exist
 */
function runViewPreferencesMigration(database: SqlJsDatabase): void {
  // Check if columns exist
  const tableInfo = database.exec('PRAGMA table_info(user_preferences)');
  if (!tableInfo[0]) return;

  const columns = tableInfo[0].values.map((row) => row[1] as string);

  // Add compact_view_enabled if missing
  if (!columns.includes('compact_view_enabled')) {
    database.run('ALTER TABLE user_preferences ADD COLUMN compact_view_enabled INTEGER NOT NULL DEFAULT 1');
  }

  // Add forward_slot_count if missing
  if (!columns.includes('forward_slot_count')) {
    database.run('ALTER TABLE user_preferences ADD COLUMN forward_slot_count INTEGER NOT NULL DEFAULT 1');
  }
}

/**
 * Migration for resolved source URLs (006-scraping-status-view)
 * Adds resolved_source_urls column to scrape_jobs table
 */
function runResolvedSourceUrlsMigration(database: SqlJsDatabase): void {
  const tableInfo = database.exec('PRAGMA table_info(scrape_jobs)');
  if (!tableInfo[0]) return;

  const columns = tableInfo[0].values.map((row) => row[1] as string);

  // Add resolved_source_urls if missing (stored as JSON string)
  if (!columns.includes('resolved_source_urls')) {
    database.run('ALTER TABLE scrape_jobs ADD COLUMN resolved_source_urls TEXT');
  }
}

export async function initializeDatabase(path: string): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  dbPath = path;

  if (existsSync(path)) {
    const buffer = readFileSync(path);
    db = new SQL.Database(buffer);
    // Run migrations for existing databases
    db.run(MIGRATIONS);
    // Run view preferences migration (005-pool-view-options)
    runViewPreferencesMigration(db);
    // Run resolved source URLs migration (006-scraping-status-view)
    runResolvedSourceUrlsMigration(db);
    saveDatabase();
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    saveDatabase();
  }

  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db || !dbPath) {
    throw new Error('Database not initialized.');
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
