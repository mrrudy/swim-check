# Tasks: Pool View Display Options

**Input**: Design documents from `/specs/005-pool-view-options/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Tests ARE included per Constitution Check in plan.md (Test-First Development is NON-NEGOTIABLE)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/frontend/src/`, `packages/backend/src/`, `packages/shared/src/`
- This is a frontend-focused feature with minimal backend changes

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared type definitions

- [X] T001 [P] Extend ViewPreferences types in packages/shared/src/types/api.ts (add compactViewEnabled, forwardSlotCount)
- [X] T002 [P] Create frontend view types in packages/frontend/src/types/views.ts (AvailabilitySummary, SlotStatus, SlotViewData, ViewPreferencesState)
- [X] T003 [P] Create color utility types in packages/frontend/src/utils/colorUtils.ts (HSLColor, ColorStop interfaces only)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and backend support that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add database migration for view preferences columns in packages/backend/src/db/migrations/ (compact_view_enabled, forward_slot_count)
- [X] T005 Update preferences service to handle new fields in packages/backend/src/services/preferences.ts
- [X] T006 [P] Implement calculateAvailabilityColor function in packages/frontend/src/utils/colorUtils.ts (HSL interpolation logic)
- [X] T007 [P] Write tests for calculateAvailabilityColor in packages/frontend/src/utils/colorUtils.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Compact Lane Availability View (Priority: P1) 🎯 MVP

**Goal**: Display lane availability as a color-coded percentage bar showing "X of Y available"

**Independent Test**: Toggle compact view on any pool detail page and verify the bar displays correct counts and colors

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Write tests for CompactAvailabilityBar component in packages/frontend/src/components/CompactAvailabilityBar.test.tsx (render with 100%, 50%, 17%, 0% availability)

### Implementation for User Story 1

- [X] T009 [US1] Implement CompactAvailabilityBar component in packages/frontend/src/components/CompactAvailabilityBar.tsx (percentage bar with color, text display)
- [X] T010 [US1] Create useViewPreferences hook skeleton in packages/frontend/src/hooks/useViewPreferences.ts (compactViewEnabled state only)
- [X] T011 [US1] Update PoolDetail.tsx to conditionally render CompactAvailabilityBar or LaneGrid in packages/frontend/src/pages/PoolDetail.tsx
- [X] T012 [US1] Add compact view toggle button to PoolDetail header in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: User Story 1 complete - compact view can be toggled and displays correct colors/percentages

---

## Phase 4: User Story 2 - Multi-Slot Forward View (Priority: P2)

**Goal**: Display multiple consecutive time slots stacked vertically with time headers

**Independent Test**: Set forward view count to 3 and verify three consecutive time slots are displayed with correct headers

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US2] Write tests for MultiSlotView component in packages/frontend/src/components/MultiSlotView.test.tsx (render 1 slot, 3 slots, loading states, error states)
- [X] T014 [P] [US2] Write tests for useMultiSlotData hook in packages/frontend/src/hooks/useMultiSlotData.test.ts (parallel fetch, slot generation, error handling)

### Implementation for User Story 2

- [X] T015 [P] [US2] Create generateForwardSlots utility in packages/frontend/src/utils/timeSlotUtils.ts (generate slot times, respect day boundary at 22:00)
- [X] T016 [US2] Create useMultiSlotData hook in packages/frontend/src/hooks/useMultiSlotData.ts (parallel API calls, individual slot loading states)
- [X] T017 [US2] Implement SlotSection component in packages/frontend/src/components/SlotSection.tsx (time header, conditional compact/detailed view)
- [X] T018 [US2] Implement MultiSlotView component in packages/frontend/src/components/MultiSlotView.tsx (vertical stacking, slot iteration)
- [X] T019 [US2] Extend useViewPreferences hook with forwardSlotCount state in packages/frontend/src/hooks/useViewPreferences.ts
- [X] T020 [US2] Integrate MultiSlotView into PoolDetail.tsx replacing single slot display in packages/frontend/src/pages/PoolDetail.tsx
- [X] T021 [US2] Add forward slot count selector to PoolDetail in packages/frontend/src/pages/PoolDetail.tsx (1-10 range)

**Checkpoint**: User Story 2 complete - multiple time slots display with individual headers and loading states

---

## Phase 5: User Story 3 - View Options Persistence (Priority: P3)

**Goal**: Persist view preferences (compact toggle and forward slot count) across browser sessions via API

**Independent Test**: Configure view options, close browser, return to app, verify settings are restored

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [P] [US3] Write tests for useViewPreferences persistence in packages/frontend/src/hooks/useViewPreferences.test.ts (load from API, save on change, default values)

### Implementation for User Story 3

- [X] T023 [US3] Extend api.ts with updateViewPreferences and getViewPreferences methods in packages/frontend/src/services/api.ts
- [X] T024 [US3] Complete useViewPreferences hook with API persistence in packages/frontend/src/hooks/useViewPreferences.ts (load on mount, save on change, optimistic updates)
- [X] T025 [US3] Add loading/saving states to view controls in PoolDetail in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: User Story 3 complete - preferences persist across sessions automatically

---

## Phase 6: User Story 4 - Combined View Options (Priority: P3)

**Goal**: Use compact view and forward view simultaneously (compact bars for multiple slots)

**Independent Test**: Enable both compact view and forward view set to 3, verify three compact bars display with time headers

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T026 [P] [US4] Write integration tests for combined view in packages/frontend/src/components/MultiSlotView.test.tsx (compact mode with multiple slots)

### Implementation for User Story 4

- [X] T027 [US4] Verify SlotSection renders CompactAvailabilityBar when compactView=true in packages/frontend/src/components/SlotSection.tsx
- [X] T028 [US4] Ensure MultiSlotView passes compactView prop correctly to all SlotSections in packages/frontend/src/components/MultiSlotView.tsx
- [X] T029 [US4] Add combined view acceptance test scenario to PoolDetail in packages/frontend/src/pages/PoolDetail.tsx (visual verification)

**Checkpoint**: User Story 4 complete - compact bars display for all forward slots simultaneously

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance, and final integration

- [X] T030 [P] Handle edge case: 0 lanes in pool data (empty state message) in packages/frontend/src/components/CompactAvailabilityBar.tsx
- [X] T031 [P] Handle edge case: slots beyond pool operating hours in packages/frontend/src/hooks/useMultiSlotData.ts
- [X] T032 [P] Add rapid toggle debouncing for view options in packages/frontend/src/hooks/useViewPreferences.ts
- [X] T033 Verify 200ms toggle response requirement (FR performance goal) in packages/frontend/src/pages/PoolDetail.tsx
- [X] T034 [P] Create ViewPreferencesPanel component to consolidate view controls in packages/frontend/src/components/ViewPreferencesPanel.tsx
- [X] T035 Run quickstart.md validation checklist to verify all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3): No dependencies on other stories
  - US2 (Phase 4): No dependencies on other stories (can run parallel with US1)
  - US3 (Phase 5): Extends work from US1 and US2 (preferences hook)
  - US4 (Phase 6): Depends on US1 (compact view) and US2 (multi-slot) being complete
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Extends useViewPreferences from US1/US2 - Can start after T010 and T019
- **User Story 4 (P3)**: Requires US1 + US2 complete - Integration story

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Utilities/types before components
- Hooks before components that use them
- Components before page integration
- Story complete before moving to dependent stories

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- Foundational tests (T007) can run parallel with database work (T004-T005)
- Color utility (T006-T007) is independent of database (T004-T005)
- US1 and US2 can be worked in parallel after Foundational complete
- Within US2: T013-T015 can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Extend ViewPreferences types in packages/shared/src/types/api.ts"
Task: "Create frontend view types in packages/frontend/src/types/views.ts"
Task: "Create color utility types in packages/frontend/src/utils/colorUtils.ts"
```

## Parallel Example: User Story 2 Tests

```bash
# Launch all US2 tests together:
Task: "Write tests for MultiSlotView component in packages/frontend/src/components/MultiSlotView.test.tsx"
Task: "Write tests for useMultiSlotData hook in packages/frontend/src/hooks/useMultiSlotData.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test compact view independently
5. Deploy/demo if ready - users can toggle compact percentage bar view

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (multi-slot view)
4. Add User Story 3 → Test independently → Deploy/Demo (persistence)
5. Add User Story 4 → Test independently → Deploy/Demo (combined view)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (compact view)
   - Developer B: User Story 2 (multi-slot view)
3. After US1 + US2 complete:
   - Developer A: User Story 3 (persistence)
   - Developer B: User Story 4 (combined view)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Color utility (T006-T007) is critical foundation for US1 - prioritize early
- Backend migration (T004-T005) must complete before any persistence testing
