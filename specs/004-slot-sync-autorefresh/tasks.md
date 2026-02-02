# Tasks: Time Slot Selection Synchronization with Auto-Refresh

**Input**: Design documents from `/specs/004-slot-sync-autorefresh/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/frontend/src/` for all frontend code
- **Tests**: Co-located with source files (e.g., `useTimeSlotState.test.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and create shared state management hook

- [X] T001 Create TypeScript interface definitions for TimeSlotState and RefreshState in packages/frontend/src/hooks/useTimeSlotState.ts
- [X] T002 [P] Create TypeScript interface definitions for UseDebounceRefreshProps and UseDebounceRefreshReturn in packages/frontend/src/hooks/useDebounceRefresh.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core unified state hook that MUST be complete before ANY user story synchronization can work

**Critical**: The useTimeSlotState hook is the single source of truth for both UI mechanisms

- [X] T003 Implement useTimeSlotState hook with date, startTime, endTime state and setters in packages/frontend/src/hooks/useTimeSlotState.ts
- [X] T004 Add slotIndex and duration derived value computation to useTimeSlotState in packages/frontend/src/hooks/useTimeSlotState.ts
- [X] T005 Add handleNavigation callback to useTimeSlotState for arrow navigation updates in packages/frontend/src/hooks/useTimeSlotState.ts
- [X] T006 Add validation for time boundaries (05:00-22:00, 30-min increments) in useTimeSlotState in packages/frontend/src/hooks/useTimeSlotState.ts

**Checkpoint**: Foundation ready - unified state hook complete, user story implementation can begin

---

## Phase 3: User Story 1 - Direct Time Selection Syncs to Navigation (Priority: P1)

**Goal**: Manual time slot selection from TimeSlotPicker immediately updates arrow navigation controls

**Independent Test**: Select a time from the manual input and verify the arrow navigation indicators update to match

### Implementation for User Story 1

- [X] T007 [US1] Refactor TimeSlotPicker to accept controlled props (date, startTime, endTime) instead of internal state in packages/frontend/src/components/TimeSlotPicker.tsx
- [X] T008 [US1] Add onDateChange, onStartTimeChange, onEndTimeChange handlers to TimeSlotPicker props in packages/frontend/src/components/TimeSlotPicker.tsx
- [X] T009 [US1] Remove internal useState calls from TimeSlotPicker, use props directly in packages/frontend/src/components/TimeSlotPicker.tsx
- [X] T010 [US1] Update PoolDetail to use useTimeSlotState hook for state management in packages/frontend/src/pages/PoolDetail.tsx
- [X] T011 [US1] Pass useTimeSlotState values and setters to TimeSlotPicker as controlled props in packages/frontend/src/pages/PoolDetail.tsx
- [X] T012 [US1] Verify arrow navigation display (SlotNavigationButtons) receives updated slotIndex when manual selection changes in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: Manual time selection now syncs to navigation arrows within 100ms (SC-001)

---

## Phase 4: User Story 2 - Arrow Navigation Syncs to Manual Input (Priority: P1)

**Goal**: Arrow button navigation immediately updates the manual time slot picker display

**Independent Test**: Click navigation arrows and verify the manual input fields update to match

### Implementation for User Story 2

- [X] T013 [US2] Refactor useSlotNavigation to accept controlled state (startTime, duration) instead of internal state in packages/frontend/src/hooks/useSlotNavigation.ts
- [X] T014 [US2] Add onNavigate callback prop to useSlotNavigation that receives new startTime, endTime, duration in packages/frontend/src/hooks/useSlotNavigation.ts
- [X] T015 [US2] Update navigatePrevious/navigateNext/extendDuration/reduceDuration to call onNavigate instead of internal setState in packages/frontend/src/hooks/useSlotNavigation.ts
- [X] T016 [US2] Compute canNavigatePrevious, canNavigateNext, canExtend, canReduce from props instead of internal state in packages/frontend/src/hooks/useSlotNavigation.ts
- [X] T017 [US2] Connect useSlotNavigation to useTimeSlotState.handleNavigation in PoolDetail in packages/frontend/src/pages/PoolDetail.tsx
- [X] T018 [US2] Pass useTimeSlotState values (startTime, duration) to useSlotNavigation in PoolDetail in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: Arrow navigation now syncs to manual input within 100ms (SC-002). Both UI elements display identical values (SC-004)

---

## Phase 5: User Story 3 - Auto-Refresh After Idle Period (Priority: P2)

**Goal**: System automatically refreshes availability data 2 seconds after user stops adjusting time slot selection

**Independent Test**: Make a selection change, wait 2 seconds, verify data refresh occurs automatically

### Implementation for User Story 3

- [X] T019 [US3] Implement useDebounceRefresh hook with setTimeout/clearTimeout pattern in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T020 [US3] Add timeSlotState dependency watching to useDebounceRefresh for triggering debounce timer in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T021 [US3] Implement timer reset (debounce) when state changes before 2s elapses in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T022 [US3] Add isRefreshing state and return it from useDebounceRefresh in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T023 [US3] Add cancelPending and refreshNow functions to useDebounceRefresh return in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T024 [US3] Implement immediate refresh on initial page load (skip debounce for first render, FR-010) in packages/frontend/src/hooks/useDebounceRefresh.ts
- [X] T025 [US3] Integrate useDebounceRefresh with PoolDetail, connecting to fetchAvailability in packages/frontend/src/pages/PoolDetail.tsx
- [X] T026 [US3] Add AbortController for canceling in-flight requests when new refresh triggers (FR-009) in packages/frontend/src/pages/PoolDetail.tsx
- [X] T027 [US3] Add loading state visual feedback during refresh (FR-007) in packages/frontend/src/pages/PoolDetail.tsx

**Checkpoint**: Auto-refresh triggers exactly 2s after last interaction (SC-003). Rapid changes result in single refresh (SC-005)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge case handling

- [X] T028 [P] Add boundary validation when navigating past first/last time slot in useSlotNavigation in packages/frontend/src/hooks/useSlotNavigation.ts
- [X] T029 [P] Add error handling and stale state indicator for failed network requests in packages/frontend/src/pages/PoolDetail.tsx
- [X] T030 Run quickstart.md validation scenarios to verify all acceptance criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run parallel with US1 if separate developers)
- **User Story 3 (Phase 5)**: Depends on Foundational phase completion (ideally after US1+US2 for full sync)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires useTimeSlotState hook from Phase 2
- **User Story 2 (P1)**: Requires useTimeSlotState hook from Phase 2
- **User Story 3 (P2)**: Requires synchronized state from US1+US2 to work correctly

### Within Each Phase

- Interface definitions before implementation
- Hooks before components that use them
- Core logic before integration
- State management before UI updates

### Parallel Opportunities

Within Phase 1:
- T001 and T002 can run in parallel (different files)

Within Phase 2:
- T003-T006 must be sequential (same file, building on each other)

Within Phase 3 (User Story 1):
- T007-T009 (TimeSlotPicker) can run in sequence
- Then T010-T012 (PoolDetail integration)

Within Phase 4 (User Story 2):
- T013-T016 (useSlotNavigation) can run in sequence
- Then T017-T018 (PoolDetail integration)

Within Phase 5 (User Story 3):
- T019-T024 (useDebounceRefresh hook) must be sequential
- Then T025-T027 (PoolDetail integration)

Within Phase 6:
- T028 and T029 can run in parallel (different files)

---

## Parallel Example: Foundational + Setup

```bash
# Launch Setup tasks in parallel:
Task: "Create TypeScript interface definitions for TimeSlotState in useTimeSlotState.ts"
Task: "Create TypeScript interface definitions for UseDebounceRefreshProps in useDebounceRefresh.ts"

# Then sequential Foundational tasks (same file):
Task: "Implement useTimeSlotState hook with state and setters"
Task: "Add slotIndex and duration derived value computation"
Task: "Add handleNavigation callback"
Task: "Add validation for time boundaries"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (interface definitions)
2. Complete Phase 2: Foundational (useTimeSlotState hook)
3. Complete Phase 3: User Story 1 (manual → arrows sync)
4. Complete Phase 4: User Story 2 (arrows → manual sync)
5. **STOP and VALIDATE**: Both selection methods stay synchronized
6. Deploy/demo synchronized UI

### Full Feature

7. Complete Phase 5: User Story 3 (auto-refresh after 2s idle)
8. Complete Phase 6: Polish (edge cases, error handling)
9. Run quickstart.md validation
10. Final testing against all success criteria (SC-001 through SC-006)

### Key Files Modified

| File | Changes |
|------|---------|
| `packages/frontend/src/hooks/useTimeSlotState.ts` | NEW - Unified state hook |
| `packages/frontend/src/hooks/useDebounceRefresh.ts` | NEW - Auto-refresh hook |
| `packages/frontend/src/hooks/useSlotNavigation.ts` | MODIFIED - Stateless refactor |
| `packages/frontend/src/components/TimeSlotPicker.tsx` | MODIFIED - Controlled component |
| `packages/frontend/src/pages/PoolDetail.tsx` | MODIFIED - Integration point |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Stories 1 and 2 are both P1 (equal priority) and can be developed in parallel
- User Story 3 (P2) should ideally wait until sync (US1+US2) is working
- Verify <100ms sync response (SC-001, SC-002) with React DevTools
- Verify 2s debounce timing (SC-003) with console logging
- Commit after each task or logical group
