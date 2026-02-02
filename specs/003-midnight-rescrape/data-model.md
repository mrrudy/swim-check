# Data Model: Midnight Booking Data Rescrape

**Feature Branch**: `003-midnight-rescrape`
**Date**: 2026-02-01

## Overview

This feature introduces scheduling and state tracking for automatic pool data scraping. It builds on existing entities (`swimming_pools`, `pool_scrapers`) and adds new state tracking capabilities.

## New Entities

### ScrapeJob

Tracks the state and history of scrape operations for each pool.

**Purpose**: Persist scrape state across application restarts; determine if today's scrape has occurred.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| pool_id | string (UUID) | Pool this job belongs to | Primary key, FK to swimming_pools |
| last_scrape_date | string | Date of last successful scrape (YYYY-MM-DD local) | Nullable |
| last_scrape_timestamp | string | ISO datetime of last scrape attempt | Nullable |
| last_scrape_status | enum | Result of last scrape | 'success' \| 'failure' |
| last_error_message | string | Error details if last scrape failed | Nullable |

**Relationships**:
- Many-to-one with `swimming_pools` (one ScrapeJob per pool)
- References scraper via `pool_scrapers` registry

**State Transitions**:
```
[No Record] → scrape started → 'success' (date updated)
                            → 'failure' (error captured)
'success' → new day midnight → scrape started → 'success'
'failure' → retry → 'success' | 'failure'
```

---

### ScrapeState (Runtime Only)

In-memory state for preventing concurrent scrapes. **Not persisted**.

**Purpose**: Lock mechanism to prevent duplicate concurrent scrapes.

| Field | Type | Description |
|-------|------|-------------|
| pool_id | string | Pool identifier |
| in_progress | boolean | Whether scrape is currently running |
| started_at | Date | When current scrape started (for timeout detection) |

**Lifecycle**:
- Created when scrape starts
- Cleared when scrape completes (success or failure)
- All states reset on application start

---

## Existing Entities (Reference)

### swimming_pools (existing)

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| name | string | Pool display name |
| location | string | Address/location |
| website_url | string | Pool website |
| total_lanes | integer | Number of lanes |
| created_at | datetime | Record creation time |
| updated_at | datetime | Last modification time |

### pool_scrapers (existing)

| Field | Type | Description |
|-------|------|-------------|
| pool_id | string (UUID) | FK to swimming_pools |
| scraper_type | string | Scraper implementation type |
| version | string | Scraper version |
| last_health_check | datetime | Last health check time |
| is_healthy | boolean | Health status |

---

## Database Schema Changes

### New Table: scrape_jobs

```sql
CREATE TABLE IF NOT EXISTS scrape_jobs (
  pool_id TEXT PRIMARY KEY,
  last_scrape_date TEXT,
  last_scrape_timestamp TEXT,
  last_scrape_status TEXT CHECK(last_scrape_status IN ('success', 'failure')),
  last_error_message TEXT,
  FOREIGN KEY (pool_id) REFERENCES swimming_pools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_date ON scrape_jobs(last_scrape_date);
```

---

## Validation Rules

### ScrapeJob
- `pool_id` must reference existing pool in `swimming_pools`
- `last_scrape_date` must be valid YYYY-MM-DD format when set
- `last_scrape_timestamp` must be valid ISO 8601 datetime when set
- `last_scrape_status` must be 'success' or 'failure'
- `last_error_message` should only be set when status is 'failure'

### ScrapeState (Runtime)
- Only one ScrapeState can have `in_progress=true` per pool at any time
- `started_at` must be set when `in_progress` becomes true

---

## Query Patterns

### Check if today's scrape occurred for a pool
```sql
SELECT 1 FROM scrape_jobs
WHERE pool_id = ? AND last_scrape_date = ? AND last_scrape_status = 'success'
```

### Get all pools needing scrape today
```sql
SELECT p.id, p.name
FROM swimming_pools p
LEFT JOIN scrape_jobs sj ON p.id = sj.pool_id
WHERE sj.last_scrape_date IS NULL
   OR sj.last_scrape_date < ?
   OR sj.last_scrape_status = 'failure'
```

### Update scrape status after completion
```sql
INSERT OR REPLACE INTO scrape_jobs
  (pool_id, last_scrape_date, last_scrape_timestamp, last_scrape_status, last_error_message)
VALUES (?, ?, ?, ?, ?)
```

---

## TypeScript Interfaces

```typescript
// Domain types for scrape job tracking
interface ScrapeJob {
  poolId: string;
  lastScrapeDate: string | null;      // YYYY-MM-DD
  lastScrapeTimestamp: Date | null;
  lastScrapeStatus: 'success' | 'failure' | null;
  lastErrorMessage: string | null;
}

// Runtime-only state (not persisted)
interface ScrapeState {
  poolId: string;
  inProgress: boolean;
  startedAt: Date | null;
}

// Scrape result for logging/reporting
interface ScrapeResult {
  poolId: string;
  poolName: string;
  success: boolean;
  duration: number;        // milliseconds
  errorMessage?: string;
  retriesUsed: number;
}

// Scheduler status for API response
interface SchedulerStatus {
  isRunning: boolean;
  nextScheduledRun: Date | null;
  lastRunTimestamp: Date | null;
  poolStatuses: PoolScrapeStatus[];
}

interface PoolScrapeStatus {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null;
  lastScrapeStatus: 'success' | 'failure' | null;
  inProgress: boolean;
}
```
