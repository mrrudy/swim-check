# Tasks: Favorites Combined Availability View

**Input**: Design documents from `/specs/007-favorites-combined-view/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/README.md ✅, quickstart.md ✅

**Tests**: Not explicitly requested in the feature specification. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `packages/frontend/src/`, `packages/backend/src/`, `packages/shared/src/`
- This feature is frontend-only; no backend changes required

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new types required by all user stories

- [x] T001 [P] Add FavoritePoolSlotData interface in packages/frontend/src/types/views.ts
- [x] T002 [P] Add CombinedSlotData interface in packages/frontend/src/types/views.ts
- [x] T003 [P] Add CombinedFavoritesState interface in packages/frontend/src/types/views.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hook that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create useCombinedFavoritesData hook skeleton in packages/frontend/src/hooks/useCombinedFavoritesData.ts
- [x] T005 Implement favorites list fetching in packages/frontend/src/hooks/useCombinedFavoritesData.ts
- [x] T006 Implement parallel availability fetching for all favorites in packages/frontend/src/hooks/useCombinedFavoritesData.ts
- [x] T007 Implement slot data organization and state updates in packages/frontend/src/hooks/useCombinedFavoritesData.ts
- [x] T008 Add refresh function and loading state management in packages/frontend/src/hooks/useCombinedFavoritesData.ts

**Checkpoint**: Foundation ready - useCombinedFavoritesData hook complete and ready for UI integration

---

## Phase 3: User Story 1 - Combined Availability View for Favorites (Priority: P1) 🎯 MVP

**Goal**: Users can see lane availability across all favorites organized by time slot

**Independent Test**: Add 2+ pools to favorites, view Home page, verify availability data appears grouped by time slot with all favorite pools listed under each slot

### Implementation for User Story 1

- [x] T009 [US1] Create CombinedSlotSection component skeleton in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T010 [US1] Implement time slot header rendering in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T011 [US1] Implement pool name and freshness badge rendering in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T012 [US1] Implement CompactAvailabilityBar display for compact view in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T013 [US1] Implement LaneGrid display for detailed view in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T014 [US1] Implement loading, error, and unavailable state handling in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T015 [US1] Implement allFailed message display in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T016 [US1] Add CombinedSlotSection styles in packages/frontend/src/components/CombinedSlotSection.css
- [x] T017 [US1] Integrate useCombinedFavoritesData hook into Home.tsx in packages/frontend/src/pages/Home.tsx
- [x] T018 [US1] Render CombinedSlotSection components for each slot in packages/frontend/src/pages/Home.tsx
- [x] T019 [US1] Handle empty favorites state in Home.tsx in packages/frontend/src/pages/Home.tsx
- [x] T020 [US1] Add loading and error states display in Home.tsx in packages/frontend/src/pages/Home.tsx

**Checkpoint**: User Story 1 complete - Combined view displays all favorites grouped by time slot

---

## Phase 4: User Story 2 - Multi-Slot Forward View for Favorites (Priority: P2)

**Goal**: Users can see multiple consecutive time slots across all favorites

**Independent Test**: Set slots ahead to 2, verify two time slot sections appear with all favorites under each

### Implementation for User Story 2

- [x] T021 [US2] Integrate useViewPreferences hook for forwardSlotCount in packages/frontend/src/pages/Home.tsx
- [x] T022 [US2] Pass forwardSlotCount to useCombinedFavoritesData hook in packages/frontend/src/pages/Home.tsx
- [x] T023 [US2] Verify multiple CombinedSlotSection components render for each forward slot in packages/frontend/src/pages/Home.tsx

**Checkpoint**: User Story 2 complete - Multiple consecutive slots display with all favorites

---

## Phase 5: User Story 3 - Compact and Detailed View Toggle (Priority: P2)

**Goal**: Users can switch between compact (percentage bars) and detailed (lane cards) views

**Independent Test**: Toggle between compact and detailed views, verify all pools in all slots update accordingly

### Implementation for User Story 3

- [x] T024 [US3] Integrate useViewPreferences hook for compactViewEnabled in packages/frontend/src/pages/Home.tsx
- [x] T025 [US3] Add ViewToggle component to Home.tsx layout in packages/frontend/src/pages/Home.tsx
- [x] T026 [US3] Pass compactView prop to all CombinedSlotSection components in packages/frontend/src/pages/Home.tsx

**Checkpoint**: User Story 3 complete - View toggle switches between compact and detailed for all pools

---

## Phase 6: User Story 4 - Time Slot Navigation (Priority: P3)

**Goal**: Users can navigate between time slots using buttons and keyboard

**Independent Test**: Click navigation buttons or press arrow keys, verify time slot shifts for all displayed pools

### Implementation for User Story 4

- [x] T027 [US4] Integrate useTimeSlotState hook in packages/frontend/src/pages/Home.tsx
- [x] T028 [US4] Integrate useSlotNavigation hook in packages/frontend/src/pages/Home.tsx
- [x] T029 [US4] Add SlotNavigationButtons component to Home.tsx layout in packages/frontend/src/pages/Home.tsx
- [x] T030 [US4] Add keyboard event handler to container div in packages/frontend/src/pages/Home.tsx
- [x] T031 [US4] Add TimeSlotPicker component for date/time selection in packages/frontend/src/pages/Home.tsx
- [x] T032 [US4] Add KeyboardHints component to Home.tsx in packages/frontend/src/pages/Home.tsx

**Checkpoint**: User Story 4 complete - Navigation buttons and keyboard arrows shift time slots for all pools

---

## Phase 7: User Story 5 - Duration Adjustment (Priority: P3)

**Goal**: Users can adjust slot duration with up/down keys or buttons

**Independent Test**: Press up/down arrows, verify duration changes for all displayed slots

### Implementation for User Story 5

- [x] T033 [US5] Ensure duration from useTimeSlotState is passed to useCombinedFavoritesData in packages/frontend/src/pages/Home.tsx
- [x] T034 [US5] Verify up/down keyboard navigation works via useSlotNavigation in packages/frontend/src/pages/Home.tsx

**Checkpoint**: User Story 5 complete - Duration changes apply to all pools in combined view

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T035 [P] Add focusable container with tabIndex={0} and outline:none styling in packages/frontend/src/pages/Home.tsx
- [x] T036 [P] Verify data freshness badges display per-pool in packages/frontend/src/components/CombinedSlotSection.tsx
- [x] T037 [P] Test with 10+ favorites to verify no layout issues in packages/frontend/src/pages/Home.tsx
- [x] T038 Run quickstart.md validation steps manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US3 builds on US1 (compact/detailed toggle)
  - US4 and US5 build on US1 (navigation)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core combined view
- **User Story 2 (P2)**: Depends on US1 - Uses same hook with forwardSlotCount
- **User Story 3 (P2)**: Depends on US1 - Uses CombinedSlotSection with compactView prop
- **User Story 4 (P3)**: Depends on US1 - Adds navigation controls
- **User Story 5 (P3)**: Depends on US1 and US4 - Extends navigation with duration

### Within Each User Story

- Component implementation before integration
- Integration into Home.tsx last
- Commit after each task or logical group

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different types in same file but independent additions)
- T035, T036, T037 can run in parallel (polish tasks)
- User stories must be sequential due to building on previous work

---

## Parallel Example: Setup Phase

```bash
# Launch all type additions together:
Task: "Add FavoritePoolSlotData interface in packages/frontend/src/types/views.ts"
Task: "Add CombinedSlotData interface in packages/frontend/src/types/views.ts"
Task: "Add CombinedFavoritesState interface in packages/frontend/src/types/views.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (12 tasks)
4. **STOP and VALIDATE**: Test combined view with 2+ favorites
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Multi-slot forward view works
4. Add User Story 3 → Compact/detailed toggle works
5. Add User Story 4 → Navigation buttons and keyboard work
6. Add User Story 5 → Duration adjustment works
7. Polish → Edge cases handled, performance verified

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1: Setup | 3 | Type definitions |
| Phase 2: Foundational | 5 | useCombinedFavoritesData hook |
| Phase 3: US1 (P1) | 12 | Combined availability view - MVP |
| Phase 4: US2 (P2) | 3 | Multi-slot forward view |
| Phase 5: US3 (P2) | 3 | Compact/detailed toggle |
| Phase 6: US4 (P3) | 6 | Time slot navigation |
| Phase 7: US5 (P3) | 2 | Duration adjustment |
| Phase 8: Polish | 4 | Cross-cutting concerns |
| **Total** | **38** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This feature is frontend-only; no backend changes required
- All existing components (CompactAvailabilityBar, LaneGrid, SlotNavigationButtons, TimeSlotPicker, KeyboardHints) are reused as-is
