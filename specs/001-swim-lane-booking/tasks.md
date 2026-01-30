# Tasks: Swim Lane Booking Checker

**Input**: Design documents from `/specs/001-swim-lane-booking/`
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/openapi.yaml (✓), quickstart.md (✓)

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a pnpm workspaces monorepo:
- `packages/shared/src/` - Shared types (@swim-check/shared)
- `packages/backend/src/` - Express API + Scrapers (@swim-check/backend)
- `packages/frontend/src/` - React UI (@swim-check/frontend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, monorepo structure, and shared type definitions

- [ ] T001 Create pnpm-workspace.yaml and root package.json at repository root
- [ ] T002 Create root tsconfig.json with shared TypeScript configuration
- [ ] T003 [P] Create packages/shared/package.json for @swim-check/shared
- [ ] T004 [P] Create packages/backend/package.json for @swim-check/backend
- [ ] T005 [P] Create packages/frontend/package.json for @swim-check/frontend
- [ ] T006 [P] Create packages/shared/tsconfig.json
- [ ] T007 [P] Create packages/backend/tsconfig.json
- [ ] T008 [P] Create packages/frontend/tsconfig.json
- [ ] T009 Run pnpm install to initialize workspace and verify all packages link correctly
- [ ] T010 [P] Create packages/shared/src/types/models.ts with SwimmingPool, Lane, LaneBooking, PoolScraper, UserPreferences, FavoritePool, TimeSlot, LaneAvailability, PoolAvailability types
- [ ] T011 [P] Create packages/shared/src/types/api.ts with API request/response types from OpenAPI contract
- [ ] T012 Create packages/shared/src/index.ts to re-export all types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T013 Create packages/backend/src/db/schema.ts with SQLite initialization using better-sqlite3 (swimming_pools, lanes, lane_bookings, pool_scrapers, user_preferences, favorite_pools, cache_entries tables)
- [ ] T014 Create packages/backend/src/db/queries.ts with base query functions for pool CRUD operations
- [ ] T015 [P] Create packages/backend/src/scrapers/types.ts with PoolScraper interface contract
- [ ] T016 Create packages/backend/src/scrapers/registry.ts with ScraperRegistry class for plugin discovery and management
- [ ] T017 [P] Create packages/backend/src/services/cache.ts with CacheService for 5-minute TTL cache operations
- [ ] T018 Create packages/backend/src/api/routes.ts with Express router setup and middleware
- [ ] T019 Create packages/backend/src/index.ts with Express server entry point
- [ ] T020 Create packages/backend/src/api/health.ts with /health endpoint implementation
- [ ] T021 Create packages/frontend/vite.config.ts with React plugin and API proxy configuration
- [ ] T022 [P] Create packages/frontend/index.html with root div mount point
- [ ] T023 Create packages/frontend/src/main.tsx with React entry point
- [ ] T024 Create packages/frontend/src/App.tsx with root component and router setup
- [ ] T025 Create packages/frontend/src/services/api.ts with base API client using fetch

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Lane Availability (Priority: P1) 🎯 MVP

**Goal**: Allow users to see how many lanes are available at swimming pools during specific time slots

**Independent Test**: Select a pool, choose a date/time, and verify that lane availability information is displayed with half-hour resolution

### Backend Implementation for User Story 1

- [ ] T026 [P] [US1] Create packages/backend/src/api/pools.ts with GET /pools (listPools) and GET /pools/:poolId (getPool) endpoints
- [ ] T027 [P] [US1] Create packages/backend/src/scrapers/pools/example/parser.ts with HTML parsing logic for example pool scraper
- [ ] T028 [US1] Create packages/backend/src/scrapers/pools/example/index.ts implementing PoolScraper interface with fetchAvailability and isHealthy methods
- [ ] T029 [US1] Create packages/backend/src/services/availability.ts with AvailabilityService implementing cache-aside pattern (check cache → scrape if miss → store → return)
- [ ] T030 [US1] Create packages/backend/src/api/availability.ts with GET /pools/:poolId/availability endpoint (date, startTime, endTime, refresh params)
- [ ] T031 [US1] Add error handling for scraper failures in packages/backend/src/services/availability.ts (retry logic, stale cache fallback, dataFreshness states)
- [ ] T032 [US1] Register example scraper in packages/backend/src/scrapers/registry.ts and wire up to availability service

### Real Scraper: Aquapark Wrocław Borowska

- [ ] T032a [P] [US1] Create packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/parser.ts with PDF parsing logic to extract 8-lane weekly schedule from reservation PDF (lanes 1-8, 30-min slots from 05:00-21:30, booking categories: schools/companies/aquaerobics/swimming lessons)
- [ ] T032b [US1] Create packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/index.ts implementing PoolScraper interface: fetch current PDF URL from https://aquapark.wroc.pl/pl/grafik-rezerwacji-basenu-sportowego, download PDF, parse with parser.ts, return lane availability
- [ ] T032c [US1] Register Aquapark Wrocław Borowska scraper in packages/backend/src/scrapers/registry.ts with pool metadata (name: "Aquapark Wrocław - Basen Sportowy", location: "ul. Borowska 99, Wrocław", laneCount: 8)

### Frontend Implementation for User Story 1

- [ ] T033 [P] [US1] Create packages/frontend/src/components/PoolCard.tsx displaying pool name, location, and lane count
- [ ] T034 [P] [US1] Create packages/frontend/src/components/LaneGrid.tsx displaying lane availability with visual indicators (available/booked)
- [ ] T035 [P] [US1] Create packages/frontend/src/components/TimeSlotPicker.tsx with date picker and start/end time selection (30-min resolution)
- [ ] T036 [US1] Create packages/frontend/src/pages/PoolDetail.tsx combining TimeSlotPicker and LaneGrid with API integration
- [ ] T037 [US1] Create packages/frontend/src/pages/Search.tsx with pool search input and PoolCard list
- [ ] T038 [US1] Add API methods to packages/frontend/src/services/api.ts for listPools, getPool, getPoolAvailability
- [ ] T039 [US1] Wire up routing in packages/frontend/src/App.tsx for /search and /pools/:poolId routes
- [ ] T040 [US1] Add loading and error states to PoolDetail.tsx showing dataFreshness (fresh/cached/stale/unavailable)
- [ ] T041 [US1] Add refresh button to PoolDetail.tsx to force availability refresh (bypass cache)

**Checkpoint**: User Story 1 complete - users can search pools and view lane availability with date/time selection

---

## Phase 4: User Story 2 - Manage Favorite Pools (Priority: P2)

**Goal**: Allow users to save and manage favorite pools for quick access

**Independent Test**: Add a pool to favorites, close/reopen app, verify favorite pool is saved and accessible

### Backend Implementation for User Story 2

- [ ] T042 [P] [US2] Create packages/backend/src/db/queries.ts additions for user_preferences and favorite_pools CRUD operations
- [ ] T043 [US2] Create packages/backend/src/api/favorites.ts with GET /favorites, POST /favorites, DELETE /favorites/:poolId, PUT /favorites/reorder endpoints
- [ ] T044 [US2] Add default UserPreferences record creation on first access in packages/backend/src/db/queries.ts

### Frontend Implementation for User Story 2

- [ ] T045 [P] [US2] Create packages/frontend/src/components/FavoriteButton.tsx with toggle functionality (add/remove from favorites)
- [ ] T046 [US2] Create packages/frontend/src/pages/Home.tsx displaying favorite pools prominently with PoolCard list
- [ ] T047 [US2] Add API methods to packages/frontend/src/services/api.ts for listFavorites, addFavorite, removeFavorite, reorderFavorites
- [ ] T048 [US2] Integrate FavoriteButton into PoolCard.tsx and PoolDetail.tsx
- [ ] T049 [US2] Update routing in packages/frontend/src/App.tsx to set Home (/) as default route showing favorites
- [ ] T050 [US2] Add drag-and-drop reordering capability to Home.tsx for favorite pools

**Checkpoint**: User Story 2 complete - users can manage favorite pools with persistence

---

## Phase 5: User Story 3 - Smart Default Time Slot (Priority: P3)

**Goal**: Automatically propose sensible default time slots based on current time and user history

**Independent Test**: Open app at various times and verify proposed start time is correctly calculated (current time + 30 mins, rounded down to nearest half hour); verify slot duration is remembered between sessions

### Backend Implementation for User Story 3

- [ ] T051 [US3] Create packages/backend/src/services/time-slot.ts with calculateDefaultStartTime (current + 30min, round down to half hour) and getDefaultEndTime (start + user duration preference) functions
- [ ] T052 [US3] Create packages/backend/src/api/preferences.ts with GET /preferences, PATCH /preferences, GET /preferences/default-time-slot endpoints
- [ ] T053 [US3] Add slotDurationMins persistence in packages/backend/src/db/queries.ts for UserPreferences updates

### Frontend Implementation for User Story 3

- [ ] T054 [US3] Add API methods to packages/frontend/src/services/api.ts for getPreferences, updatePreferences, getDefaultTimeSlot
- [ ] T055 [US3] Update packages/frontend/src/components/TimeSlotPicker.tsx to fetch and apply default time slot on mount
- [ ] T056 [US3] Update packages/frontend/src/components/TimeSlotPicker.tsx to save slot duration preference when user changes end time
- [ ] T057 [US3] Add duration display/feedback in TimeSlotPicker showing the current slot duration in hours/minutes

**Checkpoint**: User Story 3 complete - smart defaults reduce friction for availability checks

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Add input validation middleware in packages/backend/src/api/routes.ts for all endpoints (date format, time format, UUID format)
- [ ] T059 [P] Add consistent error response formatting in packages/backend/src/api/routes.ts matching OpenAPI Error schema
- [ ] T060 [P] Add CORS configuration in packages/backend/src/index.ts for frontend development
- [ ] T061 Add scraper health status to /health endpoint in packages/backend/src/api/health.ts
- [ ] T062 [P] Add responsive styling to all frontend components for mobile and desktop
- [ ] T063 [P] Add loading skeleton components for PoolCard, LaneGrid, and Home page
- [ ] T064 Verify performance: lane availability displayed within 10 seconds (SC-001)
- [ ] T065 Verify performance: app launch displays favorites within 3 seconds (SC-005)
- [ ] T066 Run quickstart.md validation - verify setup instructions work from scratch

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates FavoriteButton with US1 PoolCard but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 TimeSlotPicker but independently testable

### Within Each User Story

- Backend before frontend (API must exist for frontend to consume)
- Models/queries before services
- Services before API endpoints
- API endpoints before frontend pages
- Core implementation before integration

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003, T004, T005 (package.json files) can run in parallel
- T006, T007, T008 (tsconfig files) can run in parallel
- T010, T011 (type definitions) can run in parallel

**Phase 2 (Foundational)**:
- T015, T017 (scraper types, cache service) can run in parallel
- T021, T022 (vite config, index.html) can run in parallel

**Phase 3 (User Story 1)**:
- T026, T027 (pools API, parser) can run in parallel
- T033, T034, T035 (frontend components) can run in parallel

**Phase 4 (User Story 2)**:
- T042, T045 (queries, FavoriteButton) can run in parallel

**Cross-Story Parallelism**:
- After Phase 2, developers can split: one on US1 backend, another on US2 backend
- Frontend work can start once corresponding backend endpoints exist

---

## Parallel Example: User Story 1 Backend

```bash
# Launch model/parser tasks together:
Task: "Create packages/backend/src/api/pools.ts with GET /pools and GET /pools/:poolId endpoints"
Task: "Create packages/backend/src/scrapers/pools/example/parser.ts with HTML parsing logic"

# Then sequentially:
Task: "Create scraper index.ts" (depends on parser)
Task: "Create availability service" (depends on scraper)
Task: "Create availability endpoint" (depends on service)
```

## Parallel Example: User Story 1 Frontend

```bash
# Launch all components together:
Task: "Create packages/frontend/src/components/PoolCard.tsx"
Task: "Create packages/frontend/src/components/LaneGrid.tsx"
Task: "Create packages/frontend/src/components/TimeSlotPicker.tsx"

# Then sequentially:
Task: "Create PoolDetail page" (depends on components)
Task: "Wire up routing" (depends on pages)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T025)
3. Complete Phase 3: User Story 1 (T026-T041)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Search for pools
   - View lane availability with date/time selection
   - See refresh capability and freshness indicators
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T025)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!) (T026-T041)
3. Add User Story 2 → Test independently → Deploy/Demo (T042-T050)
4. Add User Story 3 → Test independently → Deploy/Demo (T051-T057)
5. Add Polish → Final release (T058-T066)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core availability feature)
   - Developer B: User Story 2 (favorites management)
3. After US1 and US2 merge:
   - Developer A: User Story 3 (smart defaults)
   - Developer B: Polish tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The example scraper in `packages/backend/src/scrapers/pools/example/` is a template; real pool scrapers will follow the same pattern
