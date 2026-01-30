# Data Model: Swim Lane Booking Checker

**Feature Branch**: `001-swim-lane-booking`
**Date**: 2026-01-30

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   SwimmingPool      │       │    PoolScraper      │
├─────────────────────┤       ├─────────────────────┤
│ id: string (PK)     │───────│ poolId: string (FK) │
│ name: string        │   1:1 │ scraperType: string │
│ location: string    │       │ version: string     │
│ websiteUrl: string  │       │ lastHealthCheck: ts │
│ totalLanes: number  │       │ isHealthy: boolean  │
│ createdAt: timestamp│       └─────────────────────┘
│ updatedAt: timestamp│
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐       ┌─────────────────────┐
│       Lane          │       │    LaneBooking      │
├─────────────────────┤       ├─────────────────────┤
│ id: string (PK)     │───────│ laneId: string (FK) │
│ poolId: string (FK) │   1:N │ date: date          │
│ laneNumber: number  │       │ startTime: time     │
│ label: string?      │       │ endTime: time       │
└─────────────────────┘       │ isBooked: boolean   │
                              │ scrapedAt: timestamp│
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│  UserPreferences    │       │   FavoritePool      │
├─────────────────────┤       ├─────────────────────┤
│ id: string (PK)     │───────│ preferenceId: FK    │
│ slotDurationMins:   │   1:N │ poolId: string (FK) │
│   number (default60)│       │ addedAt: timestamp  │
│ createdAt: timestamp│       │ displayOrder: number│
│ updatedAt: timestamp│       └─────────────────────┘
└─────────────────────┘

┌─────────────────────┐
│    CacheEntry       │
├─────────────────────┤
│ key: string (PK)    │
│ value: json         │
│ expiresAt: timestamp│
│ createdAt: timestamp│
└─────────────────────┘
```

---

## Entities

### SwimmingPool

Represents a physical swimming pool facility.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, UUID | Unique identifier |
| name | string | NOT NULL | Display name of the pool |
| location | string | NOT NULL | Address or location description |
| websiteUrl | string | NOT NULL | URL to pool's booking/availability page |
| totalLanes | number | NOT NULL, > 0 | Total number of lanes at the pool |
| createdAt | timestamp | NOT NULL | When record was created |
| updatedAt | timestamp | NOT NULL | When record was last updated |

**Validation Rules**:
- `name`: 1-200 characters
- `location`: 1-500 characters
- `websiteUrl`: Valid URL format
- `totalLanes`: Positive integer, typically 4-10

---

### Lane

Individual swimming lane within a pool.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, UUID | Unique identifier |
| poolId | string | FK -> SwimmingPool.id | Parent pool |
| laneNumber | number | NOT NULL | Lane number (1-based) |
| label | string | NULLABLE | Optional label (e.g., "Fast Lane", "Family") |

**Validation Rules**:
- `laneNumber`: Positive integer, unique within pool
- `label`: 0-50 characters if provided

**Invariants**:
- A pool's lane count should match SwimmingPool.totalLanes

---

### LaneBooking

Represents a time slot booking for a specific lane.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| laneId | string | FK -> Lane.id | The lane being booked |
| date | date | NOT NULL | Date of the booking |
| startTime | time | NOT NULL | Start time (HH:MM format) |
| endTime | time | NOT NULL | End time (HH:MM format) |
| isBooked | boolean | NOT NULL | Whether the slot is booked |
| scrapedAt | timestamp | NOT NULL | When this data was scraped |

**Composite Key**: (laneId, date, startTime)

**Validation Rules**:
- `startTime` < `endTime`
- Times on 30-minute boundaries (00 or 30 minutes)
- `date` should be today or in the future for queries

**State Transitions**:
- Bookings are immutable once scraped
- New scrape replaces old bookings for same (pool, date, time range)

---

### PoolScraper

Metadata about a pool's scraper module.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| poolId | string | FK -> SwimmingPool.id, UNIQUE | Associated pool |
| scraperType | string | NOT NULL | Scraper module identifier |
| version | string | NOT NULL | Scraper version (semver) |
| lastHealthCheck | timestamp | NULLABLE | When last health check ran |
| isHealthy | boolean | NOT NULL, DEFAULT true | Current health status |

**Validation Rules**:
- `scraperType`: Valid scraper module name (e.g., "cheerio", "puppeteer")
- `version`: Semver format (x.y.z)

---

### UserPreferences

Stores user-specific settings (single user for MVP).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, UUID | Unique identifier |
| slotDurationMins | number | NOT NULL, DEFAULT 60 | Last used slot duration |
| createdAt | timestamp | NOT NULL | When created |
| updatedAt | timestamp | NOT NULL | When last updated |

**Validation Rules**:
- `slotDurationMins`: Multiple of 30, range 30-480 (0.5 to 8 hours)

---

### FavoritePool

Junction table for user's favorite pools.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| preferenceId | string | FK -> UserPreferences.id | Parent preferences |
| poolId | string | FK -> SwimmingPool.id | Favorited pool |
| addedAt | timestamp | NOT NULL | When added to favorites |
| displayOrder | number | NOT NULL | Order in favorites list |

**Composite Key**: (preferenceId, poolId)

**Validation Rules**:
- `displayOrder`: Non-negative integer

---

### CacheEntry

Generic cache storage for scraped data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| key | string | PK | Cache key (e.g., "availability:pool123:2026-01-30") |
| value | json | NOT NULL | Cached JSON data |
| expiresAt | timestamp | NOT NULL | When cache expires |
| createdAt | timestamp | NOT NULL | When cached |

**Key Format**:
- Availability: `availability:{poolId}:{date}`
- Pool info: `pool:{poolId}`

---

## SQLite Schema

```sql
-- Swimming pools
CREATE TABLE swimming_pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    website_url TEXT NOT NULL,
    total_lanes INTEGER NOT NULL CHECK (total_lanes > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lanes within pools
CREATE TABLE lanes (
    id TEXT PRIMARY KEY,
    pool_id TEXT NOT NULL REFERENCES swimming_pools(id) ON DELETE CASCADE,
    lane_number INTEGER NOT NULL CHECK (lane_number > 0),
    label TEXT,
    UNIQUE (pool_id, lane_number)
);

-- Lane bookings (scraped data)
CREATE TABLE lane_bookings (
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
CREATE TABLE pool_scrapers (
    pool_id TEXT PRIMARY KEY REFERENCES swimming_pools(id) ON DELETE CASCADE,
    scraper_type TEXT NOT NULL,
    version TEXT NOT NULL,
    last_health_check TEXT,
    is_healthy INTEGER NOT NULL DEFAULT 1
);

-- User preferences (single user for MVP)
CREATE TABLE user_preferences (
    id TEXT PRIMARY KEY,
    slot_duration_mins INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration_mins >= 30 AND slot_duration_mins <= 480),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Favorite pools
CREATE TABLE favorite_pools (
    preference_id TEXT NOT NULL REFERENCES user_preferences(id) ON DELETE CASCADE,
    pool_id TEXT NOT NULL REFERENCES swimming_pools(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (preference_id, pool_id)
);

-- Generic cache
CREATE TABLE cache_entries (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX idx_lane_bookings_date ON lane_bookings(date);
CREATE INDEX idx_lane_bookings_pool_date ON lane_bookings(lane_id, date);
CREATE INDEX idx_cache_expires ON cache_entries(expires_at);
CREATE INDEX idx_favorite_pools_order ON favorite_pools(preference_id, display_order);
```

---

## TypeScript Types

```typescript
// packages/shared/src/types/models.ts

export interface SwimmingPool {
  id: string;
  name: string;
  location: string;
  websiteUrl: string;
  totalLanes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lane {
  id: string;
  poolId: string;
  laneNumber: number;
  label?: string;
}

export interface LaneBooking {
  laneId: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  isBooked: boolean;
  scrapedAt: Date;
}

export interface PoolScraper {
  poolId: string;
  scraperType: string;
  version: string;
  lastHealthCheck?: Date;
  isHealthy: boolean;
}

export interface UserPreferences {
  id: string;
  slotDurationMins: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoritePool {
  preferenceId: string;
  poolId: string;
  addedAt: Date;
  displayOrder: number;
}

// Query/Response types
export interface TimeSlot {
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
}

export interface LaneAvailability {
  laneId: string;
  laneNumber: number;
  label?: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface PoolAvailability {
  pool: SwimmingPool;
  date: string;
  timeSlot: TimeSlot;
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
  scrapedAt?: Date;
}
```

---

## Data Flow

### Availability Query Flow

```
1. User requests availability for Pool X, Date Y, Time Z
2. API checks cache: cache_entries WHERE key = 'availability:X:Y'
3. If cache hit AND not expired:
   - Return cached LaneBooking data
   - Set dataFreshness = 'cached'
4. If cache miss OR expired:
   - Look up PoolScraper for Pool X
   - Call scraper.fetchAvailability(date, timeSlot)
   - Store results in lane_bookings table
   - Update cache_entries with 5-minute TTL
   - Set dataFreshness = 'fresh'
5. Return PoolAvailability response
```

### Scraper Failure Flow

```
1. Scraper throws error during fetchAvailability
2. Check error type (retryable vs fatal)
3. If retryable: exponential backoff, retry up to 3 times
4. If all retries fail OR fatal error:
   - Mark PoolScraper.isHealthy = false
   - Return stale cached data if available (dataFreshness = 'stale')
   - Return error response if no cache (dataFreshness = 'unavailable')
5. Log error for monitoring
```
