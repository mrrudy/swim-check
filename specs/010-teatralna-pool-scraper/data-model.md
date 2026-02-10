# Data Model: Teatralna Basen 1 Pool Scraper

## Entities

### Existing Entities (No Changes)

#### SwimmingPool
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (UUID) | Primary key. Teatralna: `00000000-0000-0000-0000-000000000004` |
| name | TEXT | `"SPA Teatralna - Basen 1"` |
| location | TEXT | `"ul. Teatralna 10-12, Wrocław"` |
| website_url | TEXT | `"https://klient.spa.wroc.pl/index.php?s=basen_1"` |
| total_lanes | INTEGER | `5` (30 spots / 6 spots per lane) |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

#### Lane
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (UUID) | Primary key, auto-generated |
| pool_id | TEXT (FK) | References swimming_pools |
| lane_number | INTEGER | 1-5 for Teatralna Basen 1 |
| label | TEXT | null (conceptual lanes, no physical labels) |

5 lanes will be seeded at startup via `createLanesForPool()`.

#### ScrapeJob (existing table, no changes)
Tracks scrape status per pool — `last_scrape_date`, `last_scrape_status`, `resolved_source_urls`.

#### PoolScraper (existing table, no changes)
Tracks scraper metadata — `scraper_type`, `version`, `is_healthy`, `last_health_check`.

### New/Modified Interfaces

#### PoolScraperMetadata (modified — add optional field)
```typescript
interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
  sourceUrls?: SourceLink[];
  scrapeIntervalHours?: number;  // NEW: per-pool scrape interval (default: midnight-only)
}
```

#### TeatralnaConfig (new — scraper configuration)
```typescript
interface TeatralnaConfig {
  POOL_ID: string;            // UUID for this pool
  POOL_NAME: string;          // Display name
  SCHEDULE_URL: string;       // Base URL for schedule page
  TOTAL_SPOTS: number;        // Max spots (default: 30)
  SPOTS_PER_LANE: number;     // Spots per conceptual lane (default: 6)
  SCRAPE_INTERVAL_HOURS: number; // Scrape frequency (default: 3)
}
```

#### ParsedScheduleDay (new — internal parser type)
```typescript
interface ParsedScheduleDay {
  date: string;               // YYYY-MM-DD
  dayName: string;            // e.g., "poniedziałek"
  slots: ParsedSlot[];        // Hourly slots for this day
}
```

#### ParsedSlot (new — internal parser type)
```typescript
interface ParsedSlot {
  hour: string;               // HH:00 format (e.g., "06:00")
  freeSpots: number;          // Extracted "Wolne miejsca" count (0 if inactive/empty)
  maxSpots: number;           // Maximum spots for this slot (from page or config default)
  isActive: boolean;          // false for inactive/past slots or empty cells
}
```

## Data Flow

```
klient.spa.wroc.pl HTML
        │
        ▼
  ┌─────────────┐
  │  Cheerio     │  Parse table#schedule
  │  Parser      │  Extract dates, hours, free spots
  └──────┬──────┘
         │
         ▼
  ParsedScheduleDay[]
         │
         ▼
  ┌─────────────┐
  │  Conversion  │  freeSpots → lanes (Math.floor(spots/6))
  │  + Mapping   │  1 hour → 2 × 30-min slots
  └──────┬──────┘
         │
         ▼
  LaneAvailability[]  (existing type — per-lane isAvailable boolean)
         │
         ▼
  ┌─────────────┐
  │  Availability│  Cache-aside pattern
  │  Service     │  (existing infrastructure)
  └─────────────┘
```

## Validation Rules

1. **Free spots capping**: If `freeSpots > config.TOTAL_SPOTS`, cap at `config.TOTAL_SPOTS`
2. **Lane count bounds**: `availableLanes` capped at `Math.floor(config.TOTAL_SPOTS / config.SPOTS_PER_LANE)`
3. **Inactive slots**: Treated as 0 free spots (0 available lanes)
4. **Empty cells**: Treated as 0 free spots (0 available lanes)
5. **Missing date headers**: Parser throws `PARSE` error — schedule page format changed
6. **Non-numeric spots**: Parser logs warning and treats as 0

## State Transitions

Teatralna scraper has no internal state machine. State is managed by existing infrastructure:
- **Pool scraper health**: `is_healthy` flag in `pool_scrapers` table
- **Scrape status**: `success` | `failure` in `scrape_jobs` table
- **Scrape progress**: In-memory locks via `ScrapeState` (existing concurrency prevention)
