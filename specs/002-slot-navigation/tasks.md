# Tasks: Pool Availability Slot Navigation

**Input**: Design documents from `/specs/002-slot-navigation/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Included - Constitution requires Test-First Development (Vitest tests before implementation)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `packages/backend/src/`, `packages/frontend/src/`, `packages/shared/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure for navigation feature

- [x] T001 Create hooks directory at packages/frontend/src/hooks/
- [x] T002 [P] Add slot navigation types (SlotNavigationState, NavigationBoundaries, SlotNavigationCallbacks) to packages/shared/src/types/models.ts
- [x] T003 [P] Add SLOT_CONSTANTS to packages/shared/src/types/models.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and test infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create time slot utility functions (getSlotIndex, getTimeFromIndex, calculateEndTime) in packages/frontend/src/utils/timeSlotUtils.ts
- [x] T005 [P] Create time slot utility tests in packages/frontend/src/utils/timeSlotUtils.test.ts
- [x] T006 Verify TIME_OPTIONS array exists and is exported from packages/frontend/src/components/TimeSlotPicker.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigate Between Available Slots (Priority: P1) 🎯 MVP

**Goal**: Enable users to navigate between time slots using left/right arrow keys and Previous/Next buttons

**Independent Test**: Display pool availability, press left/right arrow keys or click navigation buttons, verify slot selection moves accordingly

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Write test: navigateNext moves to next slot in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T008 [P] [US1] Write test: navigatePrevious moves to previous slot in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T009 [P] [US1] Write test: canNavigateNext is false at last slot (22:00) in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T010 [P] [US1] Write test: canNavigatePrevious is false at first slot (05:00) in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T011 [P] [US1] Write test: handleKeyDown responds to ArrowLeft/ArrowRight in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T012 [P] [US1] Write test: SlotNavigationButtons renders Previous/Next buttons in packages/frontend/src/components/SlotNavigationButtons.test.tsx
- [x] T013 [P] [US1] Write test: SlotNavigationButtons disables buttons at boundaries in packages/frontend/src/components/SlotNavigationButtons.test.tsx

### Implementation for User Story 1

- [x] T014 [US1] Implement useSlotNavigation hook with navigation state (currentSlotIndex, startTime, endTime) in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T015 [US1] Implement navigateNext and navigatePrevious functions in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T016 [US1] Implement canNavigateNext and canNavigatePrevious boundary detection in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T017 [US1] Implement handleKeyDown for ArrowLeft/ArrowRight in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T018 [US1] Create SlotNavigationButtons component with Previous/Next buttons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T019 [US1] Add button disabled states based on canNavigatePrevious/canNavigateNext in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T020 [US1] Display current startTime in SlotNavigationButtons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T021 [US1] Integrate useSlotNavigation hook into PoolDetail page in packages/frontend/src/pages/PoolDetail.tsx
- [x] T022 [US1] Add tabIndex={0} and onKeyDown handler to PoolDetail container in packages/frontend/src/pages/PoolDetail.tsx
- [x] T023 [US1] Render SlotNavigationButtons in PoolDetail page in packages/frontend/src/pages/PoolDetail.tsx
- [x] T024 [US1] Connect navigation state changes to setTimeParams in PoolDetail in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can navigate between slots with arrow keys and buttons

---

## Phase 4: User Story 2 - Extend Booking Duration (Priority: P2)

**Goal**: Enable users to extend slot duration by 30 minutes using down arrow key or Extend button

**Independent Test**: Select any slot, press down arrow or click Extend button, verify duration increases by 30 minutes

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T025 [P] [US2] Write test: extendDuration increases duration by 30 minutes in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T026 [P] [US2] Write test: extendDuration updates endTime correctly in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T027 [P] [US2] Write test: canExtend is false when endTime would exceed 22:00 in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T028 [P] [US2] Write test: handleKeyDown responds to ArrowDown for extend in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T029 [P] [US2] Write test: SlotNavigationButtons renders Extend button in packages/frontend/src/components/SlotNavigationButtons.test.tsx
- [x] T030 [P] [US2] Write test: Extend button disabled when canExtend is false in packages/frontend/src/components/SlotNavigationButtons.test.tsx

### Implementation for User Story 2

- [x] T031 [US2] Add duration state to useSlotNavigation hook in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T032 [US2] Implement extendDuration function (duration += 30, recalculate endTime) in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T033 [US2] Implement canExtend boundary detection (endTime + 30 <= 22:00) in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T034 [US2] Add ArrowDown handling to handleKeyDown for extendDuration in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T035 [US2] Add Extend button to SlotNavigationButtons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T036 [US2] Display current duration and endTime in SlotNavigationButtons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T037 [US2] Add visual feedback when extend is blocked (pool_closing reason) in packages/frontend/src/components/SlotNavigationButtons.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can navigate slots AND extend duration

---

## Phase 5: User Story 3 - Reduce Booking Duration (Priority: P3)

**Goal**: Enable users to reduce slot duration by 30 minutes using up arrow key or Reduce button

**Independent Test**: Select a slot with duration > 30 minutes, press up arrow or click Reduce button, verify duration decreases by 30 minutes

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T038 [P] [US3] Write test: reduceDuration decreases duration by 30 minutes in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T039 [P] [US3] Write test: reduceDuration updates endTime correctly in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T040 [P] [US3] Write test: canReduce is false when duration is 30 (minimum) in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T041 [P] [US3] Write test: handleKeyDown responds to ArrowUp for reduce in packages/frontend/src/hooks/useSlotNavigation.test.ts
- [x] T042 [P] [US3] Write test: SlotNavigationButtons renders Reduce button in packages/frontend/src/components/SlotNavigationButtons.test.tsx
- [x] T043 [P] [US3] Write test: Reduce button disabled when canReduce is false in packages/frontend/src/components/SlotNavigationButtons.test.tsx

### Implementation for User Story 3

- [x] T044 [US3] Implement reduceDuration function (duration -= 30, recalculate endTime) in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T045 [US3] Implement canReduce boundary detection (duration > 30) in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T046 [US3] Add ArrowUp handling to handleKeyDown for reduceDuration in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T047 [US3] Add Reduce button to SlotNavigationButtons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T048 [US3] Add visual feedback when reduce is blocked (minimum duration) in packages/frontend/src/components/SlotNavigationButtons.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, accessibility, and user experience

- [x] T049 [P] Create KeyboardHints component displaying shortcut tips in packages/frontend/src/components/KeyboardHints.tsx
- [x] T050 [P] Write tests for KeyboardHints component in packages/frontend/src/components/KeyboardHints.test.tsx
- [x] T051 Integrate KeyboardHints into SlotNavigationButtons in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T052 Add focus state tracking (hasFocus) to useSlotNavigation for focus-aware keyboard handling in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T053 Add onFocus/onBlur handlers to PoolDetail container in packages/frontend/src/pages/PoolDetail.tsx
- [x] T054 [P] Add visual focus indicator (CSS :focus-visible) for navigation container in packages/frontend/src/pages/PoolDetail.tsx
- [x] T055 [P] Add aria-labels to all navigation buttons for accessibility in packages/frontend/src/components/SlotNavigationButtons.tsx
- [x] T056 Call e.preventDefault() in handleKeyDown to prevent page scroll on arrow keys in packages/frontend/src/hooks/useSlotNavigation.ts
- [x] T057 Connect duration changes to existing PATCH /api/v1/preferences endpoint via onSlotChange callback in packages/frontend/src/pages/PoolDetail.tsx
- [x] T058 Run all tests and verify passing (npm test)
- [x] T059 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1's useSlotNavigation hook but is independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1's useSlotNavigation hook but is independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- State management before actions
- Hook logic before component implementation
- Component before integration into PoolDetail
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003 can run in parallel (different parts of models.ts)

**Phase 2 (Foundational)**:
- T004, T005 can run in parallel (utility and test files)

**Each User Story (Tests)**:
- All [P] tests within a story can be written in parallel (same test file, but independent test cases)

**Phase 6 (Polish)**:
- T049, T050 (KeyboardHints), T054, T055 can run in parallel (different files)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "Write test: navigateNext moves to next slot"
Task: "Write test: navigatePrevious moves to previous slot"
Task: "Write test: canNavigateNext is false at last slot"
Task: "Write test: canNavigatePrevious is false at first slot"
Task: "Write test: handleKeyDown responds to ArrowLeft/ArrowRight"
Task: "Write test: SlotNavigationButtons renders Previous/Next buttons"
Task: "Write test: SlotNavigationButtons disables buttons at boundaries"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T024)
4. **STOP and VALIDATE**: Test US1 independently - navigate slots with arrows and buttons
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (extend duration)
4. Add User Story 3 → Test independently → Deploy/Demo (reduce duration)
5. Add Polish → Final testing → Complete feature

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (navigation)
   - Developer B: User Story 2 (extend) - can start tests while A implements
   - Developer C: User Story 3 (reduce) - can start tests while A implements
3. All stories integrate into same hook file but have independent test coverage

---

## Notes

- [P] tasks = different files or independent code sections, no blocking dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Constitution: Test-First Development)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No new API endpoints needed - feature is frontend-only
- Reuse existing TIME_OPTIONS and availability endpoints
