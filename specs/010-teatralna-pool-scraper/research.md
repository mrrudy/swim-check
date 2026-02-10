# Research: Teatralna Basen 1 Pool Scraper

## R-001: HTML Structure of klient.spa.wroc.pl

**Decision**: Scrape the desktop `<table id="schedule">` from `https://klient.spa.wroc.pl/index.php?s=basen_1`

**Rationale**:
- The booking system at `klient.spa.wroc.pl` serves fully server-rendered HTML — no JavaScript execution required
- The page contains two tables with class `schedule`: one is a floatThead clone (empty tbody), the other (`#schedule`) has the actual data
- Data is structured as a 7-day (Mon-Sun) weekly grid with hourly time slots (06:00-21:00)
- Each cell contains a `div.list-entry` with availability in `div.list-entry-info` as `<small>Wolne miejsca:</small>&nbsp;N`
- Inactive/past slots have class `list-entry-inactive` and empty `.list-entry-info`
- Empty cells (no session) have no `div.list-entry` at all

**Alternatives considered**:
- Mobile list view (`div.d-block.d-md-none`): simpler structure but uses DD.MM.YYYY date format — adds parsing complexity
- API endpoint discovery: no public API found; the site is PHP-based with no REST/JSON endpoints

## R-002: URL Pattern and Date Navigation

**Decision**: Use `https://klient.spa.wroc.pl/index.php?s=basen_1` as the base URL. Navigate weeks via `&date=YYYY-MM-DD` query parameter.

**Rationale**:
- Default page shows the current week (Mon-Sun)
- Date navigation links in the page use `?s=basen_1&date=YYYY-MM-DD&instructor=&type=`
- The `date` parameter accepts any date and the system returns the week containing that date
- Date headers in `<th>` contain `<small>YYYY-MM-DD</small>` — reliable for parsing
- Different pools use different `s=` parameter values: `basen_1`, `basen_2`, `basen_3`

**Alternatives considered**:
- Scraping multiple weeks: unnecessary for MVP — single page shows current week (7 days ahead)

## R-003: Spot-to-Lane Conversion

**Decision**: `availableLanes = Math.floor(freeSpots / spotsPerLane)`, `totalLanes = Math.floor(maxSpots / spotsPerLane)`

**Rationale**:
- Basen 1 has 30 total spots, divided into 5 conceptual lanes of 6 spots each
- Only full lanes are counted (partial lanes are not useful for lane swimmers)
- The max spots can vary per time slot (some slots show 12, 18, 24, 27, etc.) — `totalLanes` must be calculated per-slot
- When free spots exceed configured total (data anomaly), cap at configured max lanes

**Alternatives considered**:
- Ceiling-based rounding: would overstate availability — rejected per spec acceptance scenarios
- Fixed total lanes for all slots: would be incorrect when capacity varies by time slot (e.g., lessons reduce capacity)

## R-004: Hourly-to-30-Minute Slot Mapping

**Decision**: Duplicate each hourly reading into two 30-minute slots. Hour `HH:00` maps to slots `HH:00-HH:30` and `HH:30-(HH+1):00`.

**Rationale**:
- The system uses 30-minute slots (05:00, 05:30, 06:00, ... 22:00) as its internal granularity
- The booking system provides hourly data (06:00, 07:00, ... 21:00)
- Each hour's availability applies equally to both half-hour slots within that hour
- This matches the spec requirement (FR-004) and edge case documentation

**Alternatives considered**:
- Interpolation between hours: unjustified complexity — the booking system only reports per-hour
- Hourly slots in the system: would require frontend changes and break consistency with other pools

## R-005: Per-Pool Scrape Intervals (3-Hour Scheduling)

**Decision**: Add an optional `scrapeIntervalHours` property to the `PoolScraperMetadata` interface. The scheduler starts a separate `setInterval` for each pool that defines a custom interval, in addition to the existing midnight schedule.

**Rationale**:
- The current scheduler only fires at midnight — all pools scraped together daily
- Teatralna Basen 1 uses a live booking system where availability changes frequently — 3-hour refresh needed
- Adding per-pool intervals to the scraper metadata keeps configuration close to the scraper
- The `scrapeOrchestrator.scrapePool()` already handles single-pool scraping with concurrency prevention
- Pools without `scrapeIntervalHours` continue on the midnight-only schedule (backward compatible)

**Alternatives considered**:
- Global 3-hour interval for all pools: wasteful — PDF/Google Sheets pools change at most daily
- Cron-based scheduler: over-engineering for this use case — `setInterval` is sufficient
- Environment variable for interval: less discoverable — per-scraper config is more explicit

## R-006: Data Persistence Model

**Decision**: The scraper returns `LaneAvailability[]` following the existing interface. Data is persisted via the `AvailabilityService` cache-aside pattern.

**Rationale**:
- Existing pattern: `fetchAvailability()` returns lane availability data, `AvailabilityService` caches it
- The `scrapeOrchestrator` calls `fetchAvailability()` during scheduled scrapes — same flow applies
- `scrape_jobs` table tracks scrape status (success/failure, timestamps)
- No schema changes needed — reuses `swimming_pools`, `lanes`, and cache infrastructure

**Alternatives considered**:
- Writing directly to `lane_bookings` table: existing scrapers don't do this — cache-aside pattern is the standard
- Custom storage for spot data: unnecessary — conversion to lanes happens at scrape time

## R-007: Configurable Parameters

**Decision**: Define a `TeatralnaConfig` interface with all configurable constants in a separate `config.ts` file.

**Rationale**:
- FR-007 requires configurable constants at the top of the scraper code
- Separate file keeps the scraper class focused on logic
- Config includes: `SCHEDULE_URL`, `TOTAL_SPOTS`, `SPOTS_PER_LANE`, `POOL_NAME`, `POOL_ID`, `SCRAPE_INTERVAL_HOURS`
- Future reuse: can create a new config for Basen 2 or Basen 3 by changing these values

**Alternatives considered**:
- Inline constants: less discoverable and harder to override for other pools
- Database-stored config: over-engineering — these values change only at deploy time

## R-008: Health Check Implementation

**Decision**: HEAD request to the schedule URL with 10-second timeout (same pattern as Aquapark scraper).

**Rationale**:
- `isHealthy()` is called before each scrape attempt by the orchestrator
- HEAD request is lightweight and confirms the server is reachable
- 10-second timeout matches existing scraper patterns

**Alternatives considered**:
- GET request and validate HTML structure: too expensive for a health check — would be a full scrape
