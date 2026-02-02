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
    last_error_message TEXT
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
`;

export async function initializeDatabase(path: string): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();
  dbPath = path;

  if (existsSync(path)) {
    const buffer = readFileSync(path);
    db = new SQL.Database(buffer);
    // Run migrations for existing databases
    db.run(MIGRATIONS);
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
