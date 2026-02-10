# Tasks: Teatralna Basen 1 Pool Scraper

**Input**: Design documents from `/specs/010-teatralna-pool-scraper/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included — the plan.md constitution checks explicitly require test-first development.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/backend/src/`, `packages/backend/tests/`, `packages/shared/src/`
- Scraper directory: `packages/backend/src/scrapers/pools/teatralna-basen1/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the scraper directory structure and configuration constants

- [X] T001 Create scraper directory `packages/backend/src/scrapers/pools/teatralna-basen1/` and config file `packages/backend/src/scrapers/pools/teatralna-basen1/config.ts` with `TeatralnaConfig` interface and default constants (POOL_ID, POOL_NAME, SCHEDULE_URL, TOTAL_SPOTS=30, SPOTS_PER_LANE=6, SCRAPE_INTERVAL_HOURS=3)
- [X] T002 [P] Create test fixture directory `packages/backend/tests/scrapers/teatralna-basen1/fixtures/` and save a snapshot of `https://klient.spa.wroc.pl/index.php?s=basen_1` as `basen1-schedule.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared scraper infrastructure to support per-pool intervals — MUST be complete before user story implementation

**⚠️ CRITICAL**: User Story 2 (per-pool scheduling) depends on these foundational changes

- [X] T003 Add optional `scrapeIntervalHours` field to `PoolScraperMetadata` interface in `packages/backend/src/scrapers/types.ts`
- [X] T004 Implement `startPerPoolIntervals()` in `packages/backend/src/services/scheduler.ts` — iterate registered scrapers, start `setInterval` for each with `scrapeIntervalHours`, store interval references for cleanup
- [X] T005 Extend `stopScheduler()` in `packages/backend/src/services/scheduler.ts` to clear all per-pool interval timers
- [X] T006 Extend `getSchedulerState()` in `packages/backend/src/services/scheduler.ts` to include per-pool interval information in the state response

**Checkpoint**: Scheduler infrastructure supports per-pool intervals — user story implementation can begin

---

## Phase 3: User Story 1 — View Teatralna Basen 1 Lane Availability (Priority: P1) 🎯 MVP

**Goal**: Scrape the Teatralna Basen 1 booking page, extract spot availability, convert to lane equivalents, and store via existing availability infrastructure.

**Independent Test**: Run scraper against live website or HTML fixture. Verify spot counts translate correctly to lane equivalents (30 spots = 5 lanes, 12 spots = 2 lanes, 7 spots = 1 lane, 0 spots = 0 lanes).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Unit tests for spot-to-lane conversion in `packages/backend/tests/scrapers/teatralna-basen1/conversion.test.ts` — test `spotsToLanes()`: 30→5, 12→2, 7→1, 0→0, 35→5 (cap), reduced capacity (12 max spots → 2 total lanes), empty/inactive → 0
- [X] T008 [P] [US1] Unit tests for HTML parser in `packages/backend/tests/scrapers/teatralna-basen1/parser.test.ts` — test `parseScheduleTable()` against fixture HTML: extract dates from `<th><small>YYYY-MM-DD</small></th>`, extract free spots from `div.list-entry-info` "Wolne miejsca: N", handle inactive slots (`list-entry-inactive`), handle empty cells (no `div.list-entry`)
- [X] T009 [P] [US1] Integration test for scraper in `packages/backend/tests/scrapers/teatralna-basen1/scraper.test.ts` — test `TeatralnaBasen1Scraper.fetchAvailability()` returns correct `LaneAvailability[]`, verify hourly-to-30-minute slot duplication, verify `isHealthy()` and `getResolvedSourceUrls()`

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement parser types (`ParsedScheduleDay`, `ParsedSlot`) and parsing functions in `packages/backend/src/scrapers/pools/teatralna-basen1/parser.ts` — `parseScheduleTable(html)`: use Cheerio to parse `table#schedule`, extract date headers from `<th><small>YYYY-MM-DD</small></th>`, extract hourly slots with free spots from `div.list-entry-info` matching "Wolne miejsca" pattern, handle inactive/empty cells
- [X] T011 [P] [US1] Implement spot-to-lane conversion functions in `packages/backend/src/scrapers/pools/teatralna-basen1/parser.ts` — `spotsToLanes(freeSpots, spotsPerLane)`: `Math.floor(freeSpots / spotsPerLane)`, `calculateTotalLanes(maxSpots, spotsPerLane, configuredMax)`: floor division capped at configured max
- [X] T012 [US1] Implement `TeatralnaBasen1Scraper` class in `packages/backend/src/scrapers/pools/teatralna-basen1/index.ts` — implements `PoolScraper` interface: `fetchAvailability()` fetches HTML, parses schedule, converts spots to lanes, maps hourly to 30-minute slots, returns `LaneAvailability[]`; `isHealthy()` HEAD request with 10s timeout; `getResolvedSourceUrls()` returns static booking page URL. Export singleton instance.
- [X] T013 [US1] Seed Teatralna Basen 1 pool in `packages/backend/src/index.ts` — add `seedPool('00000000-0000-0000-0000-000000000004', 'SPA Teatralna - Basen 1', 'ul. Teatralna 10-12, Wrocław', 'https://klient.spa.wroc.pl/index.php?s=basen_1', 5)` and register scraper via `scraperRegistry.register(teatralnaBasen1Scraper)`

**Checkpoint**: Teatralna Basen 1 appears in pool list with lane availability data after manual scrape. Verify: `curl -X POST "http://localhost:3000/api/v1/admin/rescrape?poolId=00000000-0000-0000-0000-000000000004"` then `curl "http://localhost:3000/api/v1/pools/00000000-0000-0000-0000-000000000004/availability?date=2026-02-09&startTime=06:00&endTime=22:00"`

---

## Phase 4: User Story 2 — Frequent Automatic Updates (Priority: P2)

**Goal**: The Teatralna scraper runs automatically every 3 hours instead of only at midnight.

**Independent Test**: Start the server, observe that the scheduler registers a 3-hour interval for the Teatralna pool. Verify via `GET /api/v1/admin/scheduler/status` that per-pool interval is active.

### Implementation for User Story 2

- [X] T014 [US2] Set `scrapeIntervalHours: 3` on `TeatralnaBasen1Scraper` metadata in `packages/backend/src/scrapers/pools/teatralna-basen1/index.ts` (expose via the `PoolScraperMetadata` field added in T003)
- [X] T015 [US2] Wire `startPerPoolIntervals()` call in `packages/backend/src/index.ts` — after registering all scrapers, call `startPerPoolIntervals()` from scheduler so that Teatralna's 3-hour interval begins on server startup

**Checkpoint**: `GET /api/v1/admin/scheduler/status` shows Teatralna with a 3-hour per-pool interval. After 3 hours (or by advancing time in tests), a new scrape is triggered automatically.

---

## Phase 5: User Story 3 — Configurable Scraper Parameters (Priority: P3)

**Goal**: Key scraper parameters are defined as configurable constants so the scraper can be easily adapted for other spa.wroc.pl pools.

**Independent Test**: Change `TOTAL_SPOTS` to 20 and `SPOTS_PER_LANE` to 5 in config, verify scraper correctly calculates 4 total lanes.

### Implementation for User Story 3

- [X] T016 [US3] Verify and finalize `config.ts` in `packages/backend/src/scrapers/pools/teatralna-basen1/config.ts` — ensure all parameters are exported and used throughout scraper/parser (no hardcoded values in parser.ts or index.ts): `POOL_ID`, `POOL_NAME`, `SCHEDULE_URL`, `TOTAL_SPOTS`, `SPOTS_PER_LANE`, `SCRAPE_INTERVAL_HOURS`. Add JSDoc comments explaining each parameter for future developers.

**Checkpoint**: Changing config values adapts scraper behavior without modifying parsing logic.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and end-to-end verification

- [X] T017 [P] Run all existing tests to verify no regressions: `npm test`
- [X] T018 [P] Run linter to verify code style: `npm run lint`
- [X] T019 Run quickstart.md validation — follow the quickstart steps end-to-end to verify the full flow works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS User Story 2
- **User Story 1 (Phase 3)**: Depends on Phase 1 (config + fixtures). Can start in parallel with Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2 (scheduler extension) AND Phase 3 (scraper exists)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (scraper exists). Can run in parallel with Phase 4.
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 1 — No dependencies on other stories
- **User Story 2 (P2)**: Depends on Phase 2 (scheduler) + Phase 3 (US1 scraper exists)
- **User Story 3 (P3)**: Depends on Phase 3 (US1 scraper exists) — Can run in parallel with US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Parser types/functions before scraper class
- Scraper class before seeding/registration
- Core implementation before integration

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel
- **Phase 2**: T004, T005, T006 depend on T003 but can run in parallel with each other after T003
- **Phase 3 Tests**: T007, T008, T009 can all run in parallel
- **Phase 3 Implementation**: T010 and T011 can run in parallel (different concerns in same file, but no conflicts); T012 depends on T010+T011; T013 depends on T012
- **Phase 6**: T017 and T018 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for spot-to-lane conversion in packages/backend/tests/scrapers/teatralna-basen1/conversion.test.ts"
Task: "Unit tests for HTML parser in packages/backend/tests/scrapers/teatralna-basen1/parser.test.ts"
Task: "Integration test for scraper in packages/backend/tests/scrapers/teatralna-basen1/scraper.test.ts"

# Launch parser implementation tasks together:
Task: "Implement parser types and parsing functions in packages/backend/src/scrapers/pools/teatralna-basen1/parser.ts"
Task: "Implement spot-to-lane conversion functions in packages/backend/src/scrapers/pools/teatralna-basen1/parser.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (config + fixture)
2. Complete Phase 3: User Story 1 (parser, scraper, seeding)
3. **STOP and VALIDATE**: Manual scrape + verify lane availability data
4. Deploy/demo if ready — pool appears alongside Aquapark and Ślęża

### Incremental Delivery

1. Complete Setup → Config and fixtures ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Complete Foundational (Phase 2) → Scheduler supports per-pool intervals
4. Add User Story 2 → Test 3-hour cycle → Deploy
5. Add User Story 3 → Verify configurability → Deploy
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 1 + Phase 3 (US1 — scraper implementation)
2. Developer B: Phase 2 (scheduler extension)
3. Once both complete: Phase 4 (US2 — wire interval) + Phase 5 (US3 — config verification)
4. Together: Phase 6 (polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The scraper directory follows plan.md naming: `teatralna-basen1/` (not `teatralna-wroclaw/`)
- Pool ID `00000000-0000-0000-0000-000000000004` follows existing sequential pattern
