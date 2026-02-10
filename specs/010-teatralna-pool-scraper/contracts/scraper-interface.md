# Contract: TeatralnaBasen1Scraper

## Interface Implementation

The `TeatralnaBasen1Scraper` implements the existing `PoolScraper` interface. No new API endpoints are created — the pool is served through existing endpoints once seeded and registered.

### PoolScraper Contract (existing)

```typescript
class TeatralnaBasen1Scraper implements PoolScraper {
  readonly poolId: string;            // '00000000-0000-0000-0000-000000000004'
  readonly name: string;              // 'teatralna-basen1'
  readonly version: string;           // '1.0.0'
  readonly sourceUrls: SourceLink[];  // [{ url: SCHEDULE_URL, label: 'Booking Page' }]
  readonly scrapeIntervalHours: number; // 3 (NEW field on PoolScraperMetadata)

  fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]>;
  isHealthy(): Promise<boolean>;
  getResolvedSourceUrls(): ResolvedSourceLink[] | undefined;
}
```

### fetchAvailability

**Input**:
- `date: Date` — the date to check (used to identify which day column to extract from the weekly schedule)
- `timeSlot: TimeSlot` — `{ startTime: '05:00', endTime: '22:00' }` for full-day scrape (called by orchestrator)

**Output**: `LaneAvailability[]` — one entry per lane per 30-minute slot

**Behavior**:
1. Fetch HTML from `SCHEDULE_URL` (optionally with `&date=YYYY-MM-DD`)
2. Parse `table#schedule` for the 7-day weekly schedule
3. For each day and hour:
   - Extract free spots from `div.list-entry-info`
   - Convert spots to available lane count: `Math.floor(freeSpots / SPOTS_PER_LANE)`
   - Calculate total lanes: `Math.floor(maxSpots / SPOTS_PER_LANE)` (capped at configured max)
   - Map hourly data to two 30-minute slots
4. Filter for the requested `date` and `timeSlot` range
5. Return `LaneAvailability[]` with `isAvailable: true` for available lanes, `false` for occupied

**Error handling**:
- Network failure: throw error (orchestrator handles retries)
- Parse failure: throw error with `PARSE` code
- No schedule data found: return empty array

### isHealthy

**Input**: none
**Output**: `boolean`
**Behavior**: HEAD request to `SCHEDULE_URL` with 10s timeout. Returns `true` if HTTP 200.

### getResolvedSourceUrls

**Input**: none
**Output**: `ResolvedSourceLink[] | undefined`
**Behavior**: Returns `[{ url: SCHEDULE_URL, label: 'Booking Page' }]` — the URL is static (no dynamic PDF discovery like Aquapark).

## Existing API Endpoints (no changes)

The following existing endpoints automatically serve Teatralna data once the pool is seeded:

### GET /api/v1/pools
Returns list of pools including Teatralna Basen 1.

### GET /api/v1/pools/:poolId/availability
Query params: `date`, `startTime`, `endTime`, `refresh`
Returns lane availability via cache-aside pattern.

### POST /api/v1/admin/rescrape
Optional `?poolId=00000000-0000-0000-0000-000000000004`
Triggers manual scrape for Teatralna.

### GET /api/v1/admin/scheduler/status
Returns scheduler state including Teatralna scrape status and next scheduled run.
