# Tasks: Midnight Booking Data Rescrape

**Input**: Design documents from `/specs/003-midnight-rescrape/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included per Constitution Check (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `packages/backend/src/`, `packages/shared/src/`
- **Tests**: `packages/backend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, database schema, and shared types

- [X] T001 Add scrape_jobs table schema to packages/backend/src/db/schema.ts
- [X] T002 [P] Add ScrapeJob, ScrapeState, ScrapeResult, SchedulerStatus, PoolScrapeStatus interfaces to packages/shared/src/types/models.ts
- [X] T003 [P] Add RescrapeResponse, SchedulerStatusResponse, ErrorResponse types to packages/shared/src/types/api.ts
- [X] T004 [P] Add scheduler config variables (SCHEDULER_ENABLED, SCRAPE_RETRY_COUNT, SCRAPE_DELAY_MIN_MS, SCRAPE_DELAY_MAX_MS) to packages/backend/src/config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database queries and in-memory state management that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create packages/backend/src/db/scrapeJobs.ts with CRUD operations:
  - getScrapeJob(poolId)
  - getAllScrapeJobs()
  - getPoolsNeedingScrapeToday(todayDate)
  - upsertScrapeJob(job)
- [X] T006 Create in-memory ScrapeState map module in packages/backend/src/services/scrapeState.ts with:
  - getScrapeState(poolId)
  - setScrapeInProgress(poolId)
  - clearScrapeInProgress(poolId)
  - resetAllScrapeStates()
  - isAnyScrapeInProgress()

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automatic Midnight Refresh (Priority: P1) 🎯 MVP

**Goal**: Automatically trigger rescrapes for all pools after midnight when the application is running

**Independent Test**: Run the application past midnight and verify that new booking data is fetched for all configured pools

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Unit test for scheduler midnight calculation in packages/backend/tests/unit/scheduler.test.ts:
  - Test calculateMsUntilMidnight returns correct time
  - Test scheduler triggers callback at midnight
  - Test scheduler reschedules after midnight trigger
- [X] T008 [P] [US1] Unit test for scrapeOrchestrator in packages/backend/tests/unit/scrapeOrchestrator.test.ts:
  - Test sequential pool scraping with delays
  - Test retry logic with exponential backoff (2s, 4s, 8s)
  - Test continues to next pool on failure
  - Test result aggregation
  - Test concurrent scrape prevention via locks

### Implementation for User Story 1

- [X] T009 [US1] Create packages/backend/src/services/scheduler.ts with:
  - calculateMsUntilMidnight()
  - startScheduler() - sets timeout for midnight
  - stopScheduler() - clears timeout
  - Internal state: nextRunTimeout, isRunning, nextScheduledRun
- [X] T010 [US1] Create packages/backend/src/services/scrapeOrchestrator.ts with:
  - scrapeAllPools() - iterate all pools sequentially
  - scrapePool(poolId) - scrape single pool with retry
  - Internal: exponential backoff (2s, 4s, 8s), lock via scrapeState
- [X] T011 [US1] Wire scheduler to orchestrator: scheduler calls scrapeOrchestrator.scrapeAllPools() at midnight
- [X] T012 [US1] Add logging for midnight trigger and scrape results in scheduler.ts and scrapeOrchestrator.ts

**Checkpoint**: Midnight automatic refresh is fully functional and testable

---

## Phase 4: User Story 2 - Startup Catch-up Refresh (Priority: P2)

**Goal**: Check on startup if today's data exists and scrape if missing

**Independent Test**: Stop the application, wait past midnight, restart, and verify that data is fetched on startup

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US2] Unit test for startup check in packages/backend/tests/unit/scheduler.test.ts:
  - Test detects missing today's scrape and triggers scrape
  - Test skips scrape if today's data already exists
  - Test handles pools with no prior scrape record

### Implementation for User Story 2

- [X] T014 [US2] Add checkAndScrapeOnStartup() to packages/backend/src/services/scheduler.ts:
  - Query scrape_jobs for today's date
  - If any pool missing today's successful scrape, trigger scrapeAllPools()
- [X] T015 [US2] Update packages/backend/src/index.ts to call scheduler.checkAndScrapeOnStartup() and scheduler.startScheduler() after pool seeding
- [X] T016 [US2] Add logging for startup check results in scheduler.ts

**Checkpoint**: Startup catch-up refresh is fully functional and testable

---

## Phase 5: User Story 3 - Manual Force Rescrape (Priority: P3)

**Goal**: Provide API endpoint for manual force-rescraping

**Independent Test**: Make an API call and verify that fresh data is fetched regardless of when the last scrape occurred

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T017 [P] [US3] Integration test for admin API in packages/backend/tests/integration/admin-rescrape.test.ts:
  - Test POST /admin/rescrape triggers scrape for all pools
  - Test POST /admin/rescrape?poolId=X triggers scrape for specific pool
  - Test returns 404 for non-existent poolId
  - Test returns 409 when scrape already in progress
- [X] T018 [P] [US3] Integration test for scheduler status endpoint in packages/backend/tests/integration/admin-rescrape.test.ts:
  - Test GET /admin/scheduler/status returns correct structure
  - Test poolStatuses reflect current scrape state

### Implementation for User Story 3

- [X] T019 [US3] Create packages/backend/src/api/admin.ts with:
  - POST /admin/rescrape handler (optional poolId query param)
  - GET /admin/scheduler/status handler
- [X] T020 [US3] Register admin routes in packages/backend/src/index.ts
- [X] T021 [US3] Add logging for manual rescrape requests in admin.ts

**Checkpoint**: Manual force rescrape API is fully functional and testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, validation, and cleanup

- [X] T022 Run all tests and ensure they pass
- [X] T023 Validate quickstart.md scenarios manually:
  - Start application and check scheduler status
  - Trigger manual rescrape via API
  - Verify logs show expected behavior
- [X] T024 Review and update logging levels and messages for production readiness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 and US3 can start after US1 if desired
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (Foundational) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on Phase 2 + Scheduler service from US1 (T009)
- **User Story 3 (P3)**: Depends on Phase 2 + Orchestrator from US1 (T010) + Scheduler from US1/US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Services before routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup):**
```
T001 (schema) → sequential (needed first)
T002, T003, T004 → parallel (different files)
```

**Phase 2 (Foundational):**
```
T005, T006 → can run in parallel (different files)
```

**Phase 3 (US1):**
```
T007, T008 → parallel (test files)
T009, T010 → parallel (different services)
T011, T012 → sequential (depends on T009, T010)
```

**Phase 4 (US2):**
```
T013 → test first
T014, T015, T016 → sequential (T015 depends on T014)
```

**Phase 5 (US3):**
```
T017, T018 → parallel (same test file but different tests)
T019 → implementation
T020, T021 → sequential (T020 depends on T019)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (2 tasks)
3. Complete Phase 3: User Story 1 (6 tasks)
4. **STOP and VALIDATE**: Test midnight refresh independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP! (automatic midnight refresh)
3. Add User Story 2 → Test independently → Startup resilience
4. Add User Story 3 → Test independently → Operational control
5. Each story adds value without breaking previous stories

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Phase 1: Setup | 4 | T002, T003, T004 |
| Phase 2: Foundational | 2 | T005, T006 |
| Phase 3: US1 (P1) | 6 | T007+T008, T009+T010 |
| Phase 4: US2 (P2) | 4 | - |
| Phase 5: US3 (P3) | 5 | T017+T018 |
| Phase 6: Polish | 3 | - |
| **Total** | **24** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
