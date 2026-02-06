# Data Model: Scraping Status View

**Feature Branch**: `006-scraping-status-view`
**Date**: 2026-02-06

## Overview

This document defines the data entities, relationships, and state transitions for the Scraping Status View feature. The feature primarily consumes existing data with minor extensions.

---

## Entities

### 1. SourceLink (NEW)

Represents a URL used by a scraper to fetch pool data.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `url` | string | The URL to the data source | Required, valid URL |
| `label` | string | Human-readable description | Required, e.g., "Schedule Page", "PDF Schedule" |

**TypeScript Definition:**
```typescript
interface SourceLink {
  url: string;
  label: string;
}
```

**Validation Rules:**
- `url` must be a valid HTTP/HTTPS URL
- `label` must be non-empty, max 50 characters

**Notes:**
- This is a value object (no ID), embedded within scraper metadata
- Not persisted to database; defined in scraper implementations

---

### 2. PoolScraperMetadata (EXTENDED)

Extends the existing metadata interface with source URLs.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `poolId` | string (UUID) | Reference to swimming pool | Required, foreign key |
| `name` | string | Scraper identifier | Required, e.g., "aquapark-wroclaw-borowska" |
| `version` | string | Semver version | Required, e.g., "1.0.0" |
| `sourceUrls` | SourceLink[] | URLs used for scraping | **NEW**: Optional, defaults to [] |

**TypeScript Definition:**
```typescript
interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
  sourceUrls?: SourceLink[];  // NEW
}
```

**Notes:**
- Extended from existing interface in `packages/backend/src/scrapers/types.ts`
- Optional field maintains backward compatibility

---

### 3. ScrapeJob (EXISTING - Referenced)

Tracks scraping history per pool. Already exists in database.

| Field | Type | Description |
|-------|------|-------------|
| `poolId` | string (UUID) | Pool identifier (PK) |
| `lastScrapeDate` | string | YYYY-MM-DD format |
| `lastScrapeTimestamp` | Date | Full ISO timestamp |
| `lastScrapeStatus` | enum | 'success' \| 'failure' \| null |
| `lastErrorMessage` | string \| null | Error details if failed |

**Location:** `packages/shared/src/types/models.ts`

**Database Schema (existing):**
```sql
CREATE TABLE scrape_jobs (
  pool_id TEXT PRIMARY KEY,
  last_scrape_date TEXT,
  last_scrape_timestamp TEXT,
  last_scrape_status TEXT,
  last_error_message TEXT
);
```

---

### 4. PoolScrapeStatusResponse (EXTENDED)

API response type for pool scraping status.

| Field | Type | Description | Status |
|-------|------|-------------|--------|
| `poolId` | string | Pool identifier | Existing |
| `poolName` | string | Display name | Existing |
| `lastScrapeDate` | string \| null | YYYY-MM-DD | Existing |
| `lastScrapeTimestamp` | string \| null | ISO 8601 full timestamp | **NEW** |
| `lastScrapeStatus` | enum \| null | 'success' \| 'failure' | Existing |
| `lastErrorMessage` | string \| null | Error message if failed | **NEW** |
| `inProgress` | boolean | Currently scraping | Existing |
| `sourceUrls` | SourceLink[] | Scraping source links | **NEW** |

**TypeScript Definition:**
```typescript
interface PoolScrapeStatusResponse {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null;
  lastScrapeTimestamp: string | null;  // NEW
  lastScrapeStatus: 'success' | 'failure' | null;
  lastErrorMessage: string | null;      // NEW
  inProgress: boolean;
  sourceUrls: SourceLink[];             // NEW
}
```

**Location:** `packages/shared/src/types/api.ts`

---

### 5. ScrapingStatusType (NEW - Frontend)

Computed status type for UI display.

| Value | Condition | Display |
|-------|-----------|---------|
| `'success'` | status='success' AND <24h old | Green badge |
| `'stale'` | status='success' AND ≥24h old | Amber badge |
| `'failed'` | status='failure' | Red badge |
| `'never'` | status=null | Gray badge |
| `'in-progress'` | inProgress=true | Blue badge |

**TypeScript Definition:**
```typescript
type ScrapingStatusType = 'success' | 'stale' | 'failed' | 'never' | 'in-progress';
```

**Notes:**
- Frontend-only computed type
- Derived from `PoolScrapeStatusResponse` fields

---

## Relationships

```text
┌─────────────────────┐
│   SwimmingPool      │
│   (existing)        │
└─────────┬───────────┘
          │ 1:1
          │
┌─────────▼───────────┐      ┌─────────────────────┐
│   ScrapeJob         │      │   PoolScraper       │
│   (existing)        │      │   (existing)        │
│                     │      │                     │
│ - lastScrapeDate    │      │ - sourceUrls (NEW)  │
│ - lastScrapeStatus  │      │                     │
│ - lastErrorMessage  │      └──────────┬──────────┘
└─────────────────────┘                 │
                                        │ 0..*
                              ┌─────────▼──────────┐
                              │    SourceLink      │
                              │    (NEW)           │
                              │                    │
                              │ - url              │
                              │ - label            │
                              └────────────────────┘
```

**Relationship Notes:**
- `SwimmingPool` 1:1 `ScrapeJob`: Each pool has at most one scrape job record
- `PoolScraper` 0..*  `SourceLink`: Each scraper can have multiple source URLs
- Both relationships are read-only from the Scraping Status View perspective

---

## State Transitions

### Scraping Status State Machine

```text
                           ┌──────────────┐
                           │              │
        ┌──────────────────►    never     │◄──────────────────┐
        │                  │              │                   │
        │                  └──────┬───────┘                   │
        │                         │                           │
        │                         │ scrape triggered          │
        │                         ▼                           │
        │                  ┌──────────────┐                   │
        │                  │              │                   │
        │                  │ in-progress  │                   │
        │                  │              │                   │
        │                  └──────┬───────┘                   │
        │                         │                           │
        │          ┌──────────────┴──────────────┐           │
        │          │                             │           │
        │          ▼                             ▼           │
        │   ┌──────────────┐              ┌──────────────┐   │
        │   │              │              │              │   │
        │   │   success    │              │   failed     │   │
        │   │              │              │              │   │
        │   └──────┬───────┘              └──────────────┘   │
        │          │                                         │
        │          │ 24 hours elapsed                        │
        │          ▼                                         │
        │   ┌──────────────┐                                 │
        │   │              │                                 │
        └───│    stale     │─────────────────────────────────┘
            │              │        scrape triggered
            └──────────────┘
```

**State Transitions:**
1. **never → in-progress**: First scrape triggered for a pool
2. **in-progress → success**: Scrape completed without errors
3. **in-progress → failed**: Scrape encountered an error
4. **success → stale**: 24 hours elapsed since last successful scrape
5. **stale → in-progress**: Re-scrape triggered
6. **failed → in-progress**: Retry triggered
7. **success → in-progress**: Manual re-scrape triggered

**Notes:**
- State transitions are triggered by backend scraping operations
- Frontend only observes and displays current state
- "stale" is a computed state, not stored in database

---

## Data Flow

### API Request Flow

```text
Frontend                    Backend                      Database
   │                           │                            │
   │  GET /scheduler/status    │                            │
   │──────────────────────────►│                            │
   │                           │                            │
   │                           │  Query scrape_jobs         │
   │                           │───────────────────────────►│
   │                           │                            │
   │                           │◄───────────────────────────│
   │                           │  scrape job records        │
   │                           │                            │
   │                           │  Get scraper metadata      │
   │                           │  (includes sourceUrls)     │
   │                           │                            │
   │◄──────────────────────────│                            │
   │  SchedulerStatusResponse  │                            │
   │                           │                            │
   │  Compute status types     │                            │
   │  (success/stale/etc)      │                            │
   │                           │                            │
   │  Render status view       │                            │
   │                           │                            │
```

---

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| SourceLink | url | Valid HTTP/HTTPS URL |
| SourceLink | label | Non-empty, max 50 chars |
| PoolScrapeStatusResponse | lastScrapeDate | YYYY-MM-DD format or null |
| PoolScrapeStatusResponse | lastScrapeTimestamp | ISO 8601 format or null |
| ScrapingStatusType | - | Derived from status + timestamp |

---

## Migration Notes

**No database migration required.** All new fields are:
1. Extensions to TypeScript interfaces (not DB schema)
2. Derived/computed values
3. Sourced from existing scraper implementations

**Code Changes Required:**
1. Extend `PoolScraperMetadata` interface with `sourceUrls`
2. Extend `PoolScrapeStatusResponse` interface with new fields
3. Update scrapers to expose `sourceUrls`
4. Update `/admin/scheduler/status` endpoint to include new fields
