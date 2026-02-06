# Tasks: Scraping Status View

**Input**: Design documents from `/specs/006-scraping-status-view/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `packages/backend/src/`, `packages/frontend/src/`, `packages/shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type extensions that all user stories depend on

- [X] T001 [P] Add `SourceLink` interface to `packages/shared/src/types/api.ts`
- [X] T002 [P] Extend `PoolScrapeStatusResponse` interface with `lastScrapeTimestamp`, `lastErrorMessage`, and `sourceUrls` in `packages/shared/src/types/api.ts`
- [X] T003 Add `SourceLink` interface to `packages/backend/src/scrapers/types.ts` and extend `PoolScraperMetadata` with `sourceUrls` property

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend API extension that MUST be complete before frontend user stories can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `sourceUrls` property to Aquapark scraper in `packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/index.ts`
- [X] T005 [P] Add `sourceUrls` property to Śleża scraper in `packages/backend/src/scrapers/pools/sleza-centrum/index.ts`
- [X] T006 Update `/admin/scheduler/status` endpoint handler in `packages/backend/src/api/admin.ts` to include `lastScrapeTimestamp`, `lastErrorMessage`, and `sourceUrls` in response

**Checkpoint**: Backend API returns all required fields - frontend implementation can now begin

---

## Phase 3: User Story 1 - View Last Scraping Status Per Pool (Priority: P1) 🎯 MVP

**Goal**: Display a dedicated tab showing the last scraping status for each swimming pool with timestamp, status, and source links

**Independent Test**: Navigate to Scraping Status tab and verify each configured pool displays its last scrape information with timestamp, status, and source links

### Implementation for User Story 1

- [X] T007 [US1] Create timestamp formatting utility with `formatScrapedAt()` function in `packages/frontend/src/utils/formatTime.ts`
- [X] T008 [US1] Add `getScrapingStatus()` API function to `packages/frontend/src/services/api.ts`
- [X] T009 [US1] Create `ScrapingStatus` page component in `packages/frontend/src/pages/ScrapingStatus.tsx` with pool list, timestamps, and status display
- [X] T010 [US1] Add navigation link and route for `/scraping-status` in `packages/frontend/src/App.tsx`

**Checkpoint**: User Story 1 complete - users can view scraping status for all pools with timestamps and basic status

---

## Phase 4: User Story 2 - Identify Outdated or Failed Scrapes (Priority: P2)

**Goal**: Visual indicators to highlight pools with old or failed scrapes for quick issue identification

**Independent Test**: Trigger failed scrapes or wait for data to become stale, then verify visual indicators (green/amber/red/gray/blue badges) appear correctly

### Implementation for User Story 2

- [X] T011 [US2] Add `ScrapingStatusType` type and `getStatusType()` utility function to `packages/frontend/src/utils/formatTime.ts`
- [X] T012 [US2] Add status badge component with color-coded styling to `packages/frontend/src/pages/ScrapingStatus.tsx`
- [X] T013 [US2] Display error messages for failed scrapes in `packages/frontend/src/pages/ScrapingStatus.tsx`

**Checkpoint**: User Story 2 complete - users can identify failed/stale/success/never states at a glance via visual indicators

---

## Phase 5: User Story 3 - Access Scraping Source Links (Priority: P3)

**Goal**: Clickable source links for each pool that open in new browser tabs for manual verification or debugging

**Independent Test**: Click each source link and verify it opens the correct URL in a new browser tab

### Implementation for User Story 3

- [X] T014 [US3] Add clickable source links section with `target="_blank"` and `rel="noopener noreferrer"` to `packages/frontend/src/pages/ScrapingStatus.tsx`
- [X] T015 [US3] Handle pools with multiple source links and pools with no source links configured in `packages/frontend/src/pages/ScrapingStatus.tsx`

**Checkpoint**: User Story 3 complete - users can click source links to investigate scraping issues

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and improvements that affect multiple user stories

- [X] T016 [P] Handle backend API unavailability with error message and retry option in `packages/frontend/src/pages/ScrapingStatus.tsx`
- [X] T017 [P] Add loading state while fetching data in `packages/frontend/src/pages/ScrapingStatus.tsx`
- [X] T018 Run manual testing checklist from `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
  - US2 and US3 build on the `ScrapingStatus.tsx` component from US1
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates the base page component
- **User Story 2 (P2)**: Depends on US1 completion - Adds visual indicators to existing component
- **User Story 3 (P3)**: Depends on US1 completion - Adds source links to existing component
- **Note**: US2 and US3 can be done in parallel after US1 is complete

### Within Each Phase

- Setup: T001/T002 can run in parallel (shared types), then T003 (backend types)
- Foundational: T004/T005 can run in parallel (different scrapers), then T006 (uses both)
- US1: T007 before T008/T009 (utility needed), T009 before T010 (page before route)
- US2: T011 before T012/T013 (utility needed for badge logic)
- US3: T014 before T015 (basic links before edge cases)

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (same file, but independent additions)
- **Phase 2**: T004 and T005 can run in parallel (different scraper files)
- **Phase 6**: T016 and T017 can run in parallel (independent enhancements)
- **After US1**: US2 and US3 can be worked on in parallel (affect different aspects of same component)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch scraper updates together:
Task: "Add sourceUrls to Aquapark scraper in packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/index.ts"
Task: "Add sourceUrls to Śleża scraper in packages/backend/src/scrapers/pools/sleza-centrum/index.ts"

# Then update API endpoint (depends on scraper changes):
Task: "Update /admin/scheduler/status endpoint in packages/backend/src/api/admin.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type extensions)
2. Complete Phase 2: Foundational (backend API extension)
3. Complete Phase 3: User Story 1 (basic status view)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can see basic scraping status

### Incremental Delivery

1. Complete Setup + Foundational → API ready with all fields
2. Add User Story 1 → Basic status view → Deploy/Demo (MVP!)
3. Add User Story 2 → Visual indicators → Deploy/Demo
4. Add User Story 3 → Clickable links → Deploy/Demo
5. Each story adds value without breaking previous stories

### Single Developer Strategy

1. Phase 1: Setup (T001-T003) - ~15 min
2. Phase 2: Foundational (T004-T006) - ~30 min
3. Phase 3: User Story 1 (T007-T010) - ~1 hour
4. **Validate MVP**
5. Phase 4: User Story 2 (T011-T013) - ~30 min
6. Phase 5: User Story 3 (T014-T015) - ~20 min
7. Phase 6: Polish (T016-T018) - ~30 min

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Success criteria: Page loads <3s (SC-001), issues identifiable <5s (SC-002), all links work (SC-003)
