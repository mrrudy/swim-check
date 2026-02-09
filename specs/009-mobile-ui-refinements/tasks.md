# Tasks: Mobile UI Refinements

**Input**: Design documents from `/specs/009-mobile-ui-refinements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are included per constitution Principle I (Test-First Development) as specified in plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app monorepo**: `packages/frontend/src/`

---

## Phase 1: Setup

**Purpose**: No setup needed — this is a frontend-only feature modifying existing files in an existing project. No new dependencies, no new project structure.

_(No tasks in this phase — all infrastructure is already in place from features 008 and prior.)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure the existing `responsive.css` and `useMediaQuery` hook are ready for all user stories. Verify existing test infrastructure works.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Verify existing responsive.css media query structure and useMediaQuery hook work correctly by running `pnpm test` in `packages/frontend/`
- [x] T002 Add `className="pool-detail-actions"` to the actions `<div>` in `packages/frontend/src/pages/PoolDetail.tsx` (currently has only inline `style={styles.actions}`, needs class for CSS targeting)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Hide Slot Navigation Box on Small Screens (Priority: P1) 🎯 MVP

**Goal**: Completely hide the slot navigation buttons box on viewports < 800px so mobile users see availability data immediately without scrolling past redundant controls.

**Independent Test**: Resize browser below 800px breakpoint → slot navigation buttons box is invisible. Edge zone navigation still works. Above 800px, box appears as before.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] Add test in `packages/frontend/src/components/SlotNavigationButtons.test.tsx`: verify `.slot-nav-container` gets `display: none` when viewport is < 800px (mock `window.matchMedia` or use computed style assertion)

### Implementation for User Story 1

- [x] T004 [US1] Add CSS rule `.slot-nav-container { display: none }` inside the existing `@media (max-width: 799px)` block in `packages/frontend/src/responsive.css` — replacing the existing `.slot-nav-container` padding/gap overrides with `display: none`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — slot nav hidden on mobile, visible on desktop.

---

## Phase 4: User Story 2 — Edge Zone Visibility Hint (Priority: P1)

**Goal**: Show subtle semi-transparent arrow indicators at active edge zones 3 seconds after availability data is displayed, so users can discover edge navigation.

**Independent Test**: Load pool detail page → wait 3s after data appears → semi-transparent arrows (◀ ▶ ▲ ▼) visible at active edge zones. Disabled zones show no arrow. Hints don't interfere with existing flash feedback.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US2] Add tests in `packages/frontend/src/components/EdgeZoneOverlay.test.tsx`: (1) hints not visible initially when `dataLoaded=true`, (2) hints appear after 3s via `vi.useFakeTimers()` + `vi.advanceTimersByTime(3000)`, (3) hints NOT shown for disabled zones (`can*=false`), (4) hints NOT shown when `dataLoaded=false`, (5) timer resets when `dataLoaded` changes to false

### Implementation for User Story 2

- [x] T006 [US2] Add `dataLoaded` prop to `EdgeZoneOverlayProps` interface in `packages/frontend/src/components/EdgeZoneOverlay.tsx`
- [x] T007 [US2] Add `showEdgeHints` state and `useEffect` with 3-second `setTimeout` triggered by `dataLoaded` prop in `packages/frontend/src/components/EdgeZoneOverlay.tsx` (per research.md pattern)
- [x] T008 [US2] Render persistent hint arrows (`.edge-zone-hint` class, `pointer-events: none`, ~25% opacity) inside each edge zone div when `showEdgeHints` is true AND the corresponding `can*` prop is true, in `packages/frontend/src/components/EdgeZoneOverlay.tsx`
- [x] T009 [P] [US2] Add `.edge-zone-hint` styles (opacity: 0.25, pointer-events: none) and `@keyframes hint-fade-in` animation in `packages/frontend/src/responsive.css` (global section, not inside media query)
- [x] T010 [US2] Pass `dataLoaded` prop to `<EdgeZoneOverlay>` in `packages/frontend/src/pages/PoolDetail.tsx` — set to `true` when `availability` state is non-null and not refreshing

**Checkpoint**: At this point, User Story 2 should be fully functional — edge zone hints appear 3s after data loads, only for active zones.

---

## Phase 5: User Story 3 — Move Refresh Button and Cache Info to Bottom (Priority: P2)

**Goal**: On mobile viewports, reposition the refresh button and cache freshness indicator below the availability data grid using CSS `order`, so users see data first.

**Independent Test**: Load pool detail on mobile-width viewport → refresh button and cache info appear below the lane grid. On desktop, they remain above the data.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T011 [P] [US3] Add test in `packages/frontend/src/pages/PoolDetail.test.tsx`: verify `.pool-detail-actions` element renders and is accessible (acts as a smoke test for the class added in T002)

### Implementation for User Story 3

- [x] T012 [US3] Add CSS rule `.pool-detail-actions { order: 10 }` inside the `@media (max-width: 799px)` block in `packages/frontend/src/responsive.css`
- [x] T013 [US3] Add `display: flex; flex-direction: column` to the PoolDetail container (or add a wrapping class) so that the CSS `order` property takes effect, in `packages/frontend/src/pages/PoolDetail.tsx` — add `className="pool-detail-content"` to the main content area and corresponding flex column CSS in `packages/frontend/src/responsive.css`
- [x] T014 [US3] Add CSS rule to also reorder `.stale-indicator` (stale data warning) to appear near the refresh button on mobile — add `className="stale-indicator"` to the stale warning div in `packages/frontend/src/pages/PoolDetail.tsx` and `.stale-indicator { order: 11 }` in the media query in `packages/frontend/src/responsive.css`

**Checkpoint**: At this point, User Story 3 should be fully functional — refresh/cache info moves below data on mobile, stays above on desktop.

---

## Phase 6: User Story 4 — Keep Date/Time Inputs in Single Row (Priority: P2)

**Goal**: Override the existing mobile CSS that stacks date/start/end inputs vertically, keeping them in a single horizontal row using reduced `min-width` values via `clamp()`.

**Independent Test**: Load pool detail at 375px wide → date, start time, end time inputs remain on one horizontal row. At 320px, they shrink proportionally. Below ~280px, they wrap gracefully.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US4] Add test in `packages/frontend/src/components/TimeSlotPicker.test.tsx`: verify `.time-slot-picker-responsive` container renders with the expected class name (smoke test for CSS targeting)

### Implementation for User Story 4

- [x] T016 [US4] Replace the existing `.time-slot-picker-responsive { flex-direction: column !important; align-items: stretch !important; }` rule with `.time-slot-picker-responsive { flex-direction: row !important; flex-wrap: wrap; gap: 8px !important; align-items: flex-end !important; }` in the `@media (max-width: 799px)` block in `packages/frontend/src/responsive.css`
- [x] T017 [US4] Add `.time-slot-picker-responsive input[type="date"] { min-width: clamp(100px, 28vw, 150px) !important; }` and `.time-slot-picker-responsive select { min-width: clamp(65px, 18vw, 100px) !important; }` in the `@media (max-width: 799px)` block in `packages/frontend/src/responsive.css`

**Checkpoint**: At this point, User Story 4 should be fully functional — time inputs remain in a single row on mobile viewports.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify all stories work together and no regressions exist.

- [x] T018 Run full test suite (`pnpm test` in `packages/frontend/`) to verify no regressions across all stories
- [ ] T019 Manually verify all 4 acceptance scenarios from quickstart.md at 375px, 320px, 280px, and 800px+ viewports
- [ ] T020 Verify existing edge zone flash feedback (tap → arrow flash) still works correctly alongside new hints
- [ ] T021 Verify keyboard navigation (arrow keys) still functions when slot navigation box is hidden on mobile

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A — no setup needed
- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T002 for class name)
- **User Story 2 (Phase 4)**: Depends on Phase 2 only — independent of US1
- **User Story 3 (Phase 5)**: Depends on Phase 2 (T002 for `.pool-detail-actions` class)
- **User Story 4 (Phase 6)**: Depends on Phase 2 only — independent of US1, US2, US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent — CSS-only change to responsive.css
- **User Story 2 (P1)**: Independent — component state + CSS, different files from US1
- **User Story 3 (P2)**: Independent — CSS order + className additions
- **User Story 4 (P2)**: Independent — CSS-only overrides in responsive.css

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- CSS changes after component changes (when both exist)
- Verify independently at each checkpoint

### Parallel Opportunities

- T003, T005, T011, T015 (all tests) can run in parallel since they target different files
- US1 and US2 can be implemented in parallel (different files: responsive.css vs EdgeZoneOverlay.tsx)
- US3 and US4 can be implemented in parallel (US3 touches PoolDetail.tsx + responsive.css, US4 is responsive.css only — but US4's responsive.css changes are in different selectors)
- T009 (hint CSS) can run in parallel with T006-T008 (hint logic) since they are different files

---

## Parallel Example: User Stories 1 & 2

```bash
# These can run in parallel after Phase 2:

# Stream 1 — User Story 1 (CSS-only):
Task T003: Test for slot nav hidden on mobile
Task T004: CSS display:none rule for .slot-nav-container

# Stream 2 — User Story 2 (Component + CSS):
Task T005: Tests for edge zone hints
Task T006: Add dataLoaded prop
Task T007: Add showEdgeHints state + timer
Task T008: Render hint arrows
Task T009: Hint CSS styles (parallel with T006-T008)
Task T010: Pass dataLoaded prop in PoolDetail
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T004)
3. **STOP and VALIDATE**: Hide slot nav box on mobile — test independently
4. Immediate value: mobile users see data without scrolling past nav controls

### Incremental Delivery

1. Complete Foundational → Ready
2. Add User Story 1 → Test → Mobile nav box hidden (MVP!)
3. Add User Story 2 → Test → Edge zone hints visible after 3s
4. Add User Story 3 → Test → Refresh button moves to bottom on mobile
5. Add User Story 4 → Test → Time inputs stay in single row
6. Each story adds mobile usability value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational (Phase 2) together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4 (both CSS-only, fast)
   - Developer B: User Story 2 (component logic + CSS)
   - Developer C: User Story 3 (CSS order + class names)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All CSS changes are scoped to `@media (max-width: 799px)` except hint animation keyframes
- Desktop layout (≥ 800px) must remain completely unchanged
