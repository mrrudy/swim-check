# Implementation Plan: Teatralna Basen 1 Pool Scraper

**Branch**: `010-teatralna-pool-scraper` | **Date**: 2026-02-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-teatralna-pool-scraper/spec.md`

## Summary

Add a new pool scraper for Teatralna Basen 1 (spa.wroc.pl) that scrapes the HTML-based booking system at `klient.spa.wroc.pl`, extracts per-hour spot availability ("Wolne miejsca: N"), translates spots into lane equivalents (30 spots = 5 lanes, 6 spots/lane), maps hourly data to 30-minute slots, and runs every 3 hours via a new per-pool scheduling interval. The scraper implements the existing `PoolScraper` interface and registers with the `ScraperRegistry`.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js 20 LTS (ES2022 target)
**Primary Dependencies**: Express.js 4.18.2, Cheerio (HTML parsing), sql.js 1.10.0
**Storage**: SQLite via sql.js (`./swim-check.db`) — existing `lane_bookings`, `scrape_jobs`, `pool_scrapers` tables
**Testing**: Vitest (existing test runner)
**Target Platform**: Node.js server (Linux/Windows)
**Project Type**: Web application (monorepo: `packages/backend`, `packages/frontend`, `packages/shared`)
**Performance Goals**: Scrape completes within 30 seconds; 3-hour refresh cycle
**Constraints**: Server-rendered HTML (no JS execution needed); polite scraping with existing inter-pool delays
**Scale/Scope**: Single new pool scraper; scheduler enhancement for per-pool intervals

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development — PASS

- Tests will be written before implementation for:
  - Spot-to-lane conversion logic (unit)
  - HTML parsing of the booking page (unit, with fixture HTML)
  - Hourly-to-30-minute slot mapping (unit)
  - Scraper interface compliance (integration)
  - Per-pool scheduling interval (unit)
- Test fixtures: saved HTML snapshots from `klient.spa.wroc.pl` for deterministic testing

### II. Readable Code — PASS

- Scraper follows existing naming patterns (`teatralna-basen1/` directory)
- Configuration constants at top of file with descriptive names
- Parsing logic broken into named functions: `parseScheduleTable()`, `extractFreeSpots()`, `spotsToLanes()`
- Follows existing scraper structure (aquapark, sleza patterns)

### III. Simplicity — PASS

- Reuses existing `PoolScraper` interface, `ScraperRegistry`, `ScrapeOrchestrator`
- Uses Cheerio (already a dependency) for HTML parsing — no new dependencies
- Spot-to-lane math is a simple `Math.floor()` operation
- Per-pool interval: minimal scheduler extension (add interval config to scraper metadata)
- No new abstractions needed — fits cleanly into existing patterns

## Project Structure

### Documentation (this feature)

```text
specs/010-teatralna-pool-scraper/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── src/
│   ├── scrapers/
│   │   ├── types.ts                          # PoolScraper interface (extend with scrapeIntervalHours?)
│   │   ├── registry.ts                       # ScraperRegistry (no changes expected)
│   │   └── pools/
│   │       └── teatralna-basen1/
│   │           ├── index.ts                  # TeatralnaBasen1Scraper class
│   │           ├── config.ts                 # Configurable constants (URL, spots, lanes)
│   │           └── parser.ts                 # HTML parsing logic
│   ├── services/
│   │   ├── scheduler.ts                      # Extend for per-pool intervals
│   │   └── scrapeOrchestrator.ts             # May need interval-aware triggering
│   └── index.ts                              # Seed Teatralna pool + lanes
├── tests/
│   └── scrapers/
│       └── teatralna-basen1/
│           ├── parser.test.ts                # HTML parsing tests
│           ├── conversion.test.ts            # Spot-to-lane conversion tests
│           ├── scraper.test.ts               # Integration tests
│           └── fixtures/
│               └── basen1-schedule.html      # Saved HTML fixture

packages/shared/
└── src/types/models.ts                       # No changes expected (reuses existing types)
```

**Structure Decision**: Web application structure (Option 2). New scraper goes in `packages/backend/src/scrapers/pools/teatralna-basen1/` following the aquapark and sleza patterns. No frontend changes needed — the pool will appear automatically once seeded and scraped.

## Constitution Re-Check (Post-Design)

### I. Test-First Development — PASS
- Design artifacts define clear testable contracts (scraper interface, parser output, conversion formulas)
- Test fixtures will capture real HTML structure for deterministic parsing tests
- No additional testability concerns from design phase

### II. Readable Code — PASS
- Separate `config.ts`, `parser.ts`, `index.ts` files maintain single responsibility
- Parser types (`ParsedScheduleDay`, `ParsedSlot`) are self-documenting
- Data flow is linear: HTML → parsed slots → lane availability

### III. Simplicity — PASS
- No new database tables or schema changes
- No new API endpoints — reuses existing pool/availability/admin routes
- Single new interface field (`scrapeIntervalHours`) for scheduler extension
- Scraper class follows established patterns exactly

## Complexity Tracking

> No constitution violations — no tracking needed.

