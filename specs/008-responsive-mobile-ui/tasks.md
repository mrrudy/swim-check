# Tasks: Responsive Mobile UI

**Input**: Design documents from `/specs/008-responsive-mobile-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the constitution requires test-first development (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `packages/frontend/src/` for source, tests co-located in same directories
- Inline styles are the convention; responsive CSS via a single global CSS file

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared utilities and CSS foundations used by all user stories

- [X] T001 Create `useMediaQuery` hook in `packages/frontend/src/hooks/useMediaQuery.ts` using `useSyncExternalStore` + `window.matchMedia` (per research R2)
- [X] T002 Write tests for `useMediaQuery` hook in `packages/frontend/src/hooks/useMediaQuery.test.ts` — mock `window.matchMedia`, verify true/false based on query match, verify listener cleanup
- [X] T003 [P] Create `packages/frontend/src/responsive.css` with edge-flash keyframe animation and mobile breakpoint rules (per contracts/responsive.css): `.app-container`, `.app-header`, `.app-title`, `.app-subtitle`, `.nav-inline`, `.nav-hamburger`, `.slot-nav-container`, `.slot-nav-button`, `.lane-grid-responsive`, `.pool-card-responsive`, `.time-slot-picker-responsive`
- [X] T004 [P] Import `responsive.css` in `packages/frontend/src/main.tsx`

**Checkpoint**: Shared hook and CSS are in place — component work can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add CSS class names to existing components so responsive.css rules can target them. MUST complete before user story integration.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Add `className="app-container"` to outermost div, `className="app-header"` to header div, `className="app-title"` to title element, `className="app-subtitle"` to subtitle element, `className="nav-inline"` to nav element in `packages/frontend/src/App.tsx` (alongside existing inline styles)
- [X] T006 [P] Add `className="slot-nav-container"` and `className="slot-nav-button"` to container and button elements in `packages/frontend/src/components/SlotNavigationButtons.tsx`
- [X] T007 [P] Add `className="lane-grid-responsive"` to grid container in `packages/frontend/src/components/LaneGrid.tsx`
- [X] T008 [P] Add `className="pool-card-responsive"` to card container in `packages/frontend/src/components/PoolCard.tsx`
- [X] T009 [P] Add `className="time-slot-picker-responsive"` to picker container in `packages/frontend/src/components/TimeSlotPicker.tsx` (if applicable for layout reflow)

**Checkpoint**: Foundation ready — all existing components have responsive class hooks. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 — Responsive Navigation Menu (Priority: P1) 🎯 MVP

**Goal**: Collapse the main navigation menu (Favorites, Search Pools, Scraping Status) into a hamburger menu button (☰) on screens below 800px.

**Independent Test**: Resize browser window below 800px → menu collapses to hamburger button → tap button → dropdown with all nav items appears → select item → navigates and menu closes.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Write tests for HamburgerMenu component in `packages/frontend/src/components/HamburgerMenu.test.tsx` — test: renders toggle button with ☰ text, opens dropdown on click, closes on item click, closes on outside click (mousedown), closes on Escape key, all 3 nav items present, ARIA attributes (`aria-expanded`, `aria-controls`, `aria-label`) correct, focus returns to button on Escape

### Implementation for User Story 1

- [X] T011 [US1] Implement HamburgerMenu component in `packages/frontend/src/components/HamburgerMenu.tsx` — self-contained with React Router Links, `useRef` for click-outside detection, `max-height` CSS transition for open/close animation, 48x48px minimum touch target, Escape key handler with focus return to button (per research R3–R6, R12)
- [X] T012 [US1] Integrate HamburgerMenu into `packages/frontend/src/App.tsx` — use `useMediaQuery('(max-width: 799px)')` to conditionally render `<HamburgerMenu />` (with `className="nav-hamburger"`) on mobile vs inline `<nav>` (with `className="nav-inline"`) on desktop
- [X] T013 [US1] Verify all HamburgerMenu tests pass (T010) and manually test toggle, close behaviors, and menu animation at various viewport widths

**Checkpoint**: At this point, User Story 1 should be fully functional — hamburger menu works on mobile, inline nav on desktop.

---

## Phase 4: User Story 2 — Edge-Zone Slot Navigation (Priority: P1)

**Goal**: Add invisible edge-zone overlays on the slot display area so tapping/clicking the outer 5% of each side triggers navigation (left=Prev, right=Next, top=-30m, bottom=+30m).

**Independent Test**: On the Pool Detail or Home page, click within the rightmost 5% of the slot area → "Next" fires; leftmost 5% → "Previous" fires; bottom 5% → +30m; top 5% → -30m. Visual feedback arrow flashes briefly. Center area clicks pass through. Disabled zones are no-ops.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US2] Write tests for EdgeZoneOverlay component in `packages/frontend/src/components/EdgeZoneOverlay.test.tsx` — test: renders children, calls `onNavigateNext` on right edge click, calls `onNavigatePrevious` on left edge click, calls `onExtend` on bottom edge click, calls `onReduce` on top edge click, does NOT call callback when `can*` prop is false, shows visual feedback arrow on click, feedback clears after animation ends

### Implementation for User Story 2

- [X] T015 [US2] Implement EdgeZoneOverlay component in `packages/frontend/src/components/EdgeZoneOverlay.tsx` — position:relative container with 4 absolutely-positioned overlay divs (left/right at z-index 3, top/bottom at z-index 2), 5% width/height with min-width/min-height 20px, directional arrow feedback (◀▶▲▼) via `flashDirection` state + `edge-flash` CSS animation + `onAnimationEnd`, `stopPropagation()` on edge clicks (per research R7–R10, data-model.md)
- [X] T016 [US2] Integrate EdgeZoneOverlay into `packages/frontend/src/pages/Home.tsx` — wrap CombinedSlotSection / MultiSlotView area with `<EdgeZoneOverlay>`, passing `onNavigatePrevious`, `onNavigateNext`, `onExtend`, `onReduce` and `can*` boundary flags from `useSlotNavigation` hook
- [X] T017 [US2] Integrate EdgeZoneOverlay into `packages/frontend/src/pages/PoolDetail.tsx` — wrap LaneGrid / slot display area with `<EdgeZoneOverlay>`, passing navigation callbacks and boundary flags from `useSlotNavigation` hook
- [X] T018 [US2] Verify all EdgeZoneOverlay tests pass (T014), verify keyboard navigation (arrow keys) still works alongside edge zones, and manually test edge-zone taps on both pages

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Core mobile interaction is complete.

---

## Phase 5: User Story 3 — Compact Header and Title (Priority: P2)

**Goal**: On mobile viewports (<800px), reduce the app title to a compact single-line format and hide the subtitle to save vertical space (header ≤48px).

**Independent Test**: View app on a screen narrower than 800px → title is smaller (18px), subtitle is hidden, header occupies a single compact row. On screens ≥800px, title and subtitle display at current sizes.

### Implementation for User Story 3

- [X] T019 [US3] Verify compact header behavior in `packages/frontend/src/App.tsx` — confirm that `className` attributes added in T005 combined with responsive.css rules from T003 produce: title 18px on mobile, subtitle hidden on mobile, header max-height 48px on mobile, single-row layout with hamburger button. Adjust styles if needed.
- [X] T020 [US3] Manually test header at multiple viewport widths (320px, 480px, 799px, 800px, 1024px, 1920px) — verify title sizing, subtitle visibility, header height constraint, and smooth transition at breakpoint

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work. Header is compact on mobile.

---

## Phase 6: User Story 4 — Overall Mobile-Friendly Layout (Priority: P2)

**Goal**: Ensure all page content (pool lists, slot grids, search results, scraping status) reflows cleanly on mobile screens with no horizontal scrollbar from 320px to 1920px.

**Independent Test**: Load each page (Favorites, Search, Pool Detail, Scraping Status) at 320px viewport width → no horizontal scrollbar, content stacks vertically, grid columns adjust.

### Implementation for User Story 4

- [X] T021 [P] [US4] Verify and adjust responsive layout in `packages/frontend/src/pages/Search.tsx` — ensure search form, results list, and pool cards reflow to full-width on mobile; add class names if needed for responsive.css targeting
- [X] T022 [P] [US4] Verify and adjust responsive layout in `packages/frontend/src/pages/ScrapingStatus.tsx` — ensure status table/list reflows without horizontal scroll on mobile; add class names if needed
- [X] T023 [US4] Verify and adjust `packages/frontend/src/components/CombinedSlotSection.tsx` and `packages/frontend/src/components/CombinedSlotSection.css` — ensure combined favorites view stacks pool cards vertically and full-width on mobile
- [X] T024 [US4] Test all 4 pages (Home, Search, PoolDetail, ScrapingStatus) at viewport widths 320px, 375px, 414px, 768px, 800px, 1024px, 1440px, 1920px — verify no horizontal scrollbar and clean vertical reflow on every page
- [X] T025 [US4] Test device rotation behavior — verify layout transitions smoothly between collapsed and expanded states when viewport width crosses the 800px breakpoint

**Checkpoint**: All user stories should now be independently functional. Every page is mobile-friendly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and improvements that span multiple user stories

- [X] T026 Verify all existing keyboard shortcuts (arrow keys for slot navigation) continue to work identically per SC-007 — test on both desktop and mobile viewports
- [X] T027 Verify edge-zone visual feedback timing: feedback appears <100ms after tap, disappears within 300ms (SC-005)
- [X] T028 Verify menu toggle animation completes in <200ms perceived transition (SC-006)
- [X] T029 Run full frontend test suite (`cd packages/frontend && npm test`) — ensure no regressions from responsive changes
- [X] T030 Run quickstart.md verification checklist — validate all success criteria (SC-001 through SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T003 (responsive.css) from Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different components, different pages)
  - US3 depends on T005 (App.tsx class names) + T003 (responsive.css) — mostly verification
  - US4 depends on T003 (responsive.css) + T005-T009 (class names) — mostly verification and tweaks
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories. Needs T001 (useMediaQuery), T003 (responsive.css), T005 (App.tsx classes).
- **User Story 2 (P1)**: Can start after Phase 2 — no dependencies on other stories. Needs T003 (responsive.css, for edge-flash animation).
- **User Story 3 (P2)**: Can start after Phase 2 — primarily verification of T003 + T005 output. No new components.
- **User Story 4 (P2)**: Can start after Phase 2 — verification and adjustment across all pages. T021/T022 are parallelizable.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Component implementation before page integration
- Page integration before cross-cutting verification
- Story complete before moving to next priority

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- T005, T006, T007, T008, T009 can ALL run in parallel (different component files)
- T010 and T014 can run in parallel (test files for different components)
- T011 and T015 can run in parallel (different new component files)
- T016 and T017 can run in parallel (different page files)
- T021 and T022 can run in parallel (different page files)
- US1 and US2 can be implemented in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Write test first:
Task: "Write HamburgerMenu tests in packages/frontend/src/components/HamburgerMenu.test.tsx"

# Then implement:
Task: "Implement HamburgerMenu in packages/frontend/src/components/HamburgerMenu.tsx"

# Then integrate:
Task: "Integrate HamburgerMenu into packages/frontend/src/App.tsx"
```

## Parallel Example: User Story 2

```bash
# Write test first:
Task: "Write EdgeZoneOverlay tests in packages/frontend/src/components/EdgeZoneOverlay.test.tsx"

# Then implement:
Task: "Implement EdgeZoneOverlay in packages/frontend/src/components/EdgeZoneOverlay.tsx"

# Then integrate pages in parallel:
Task: "Integrate EdgeZoneOverlay in packages/frontend/src/pages/Home.tsx"
Task: "Integrate EdgeZoneOverlay in packages/frontend/src/pages/PoolDetail.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (useMediaQuery + responsive.css)
2. Complete Phase 2: Foundational (class names on existing components)
3. Complete Phase 3: User Story 1 (HamburgerMenu)
4. **STOP and VALIDATE**: Test hamburger menu independently at various viewports
5. Deploy/demo if ready — mobile navigation is usable

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Hamburger Menu) → Test independently → Deploy/Demo (**MVP!**)
3. Add User Story 2 (Edge Zones) → Test independently → Deploy/Demo
4. Add User Story 3 (Compact Header) → Test independently → Deploy/Demo
5. Add User Story 4 (Full Layout) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (HamburgerMenu)
   - Developer B: User Story 2 (EdgeZoneOverlay)
3. After US1+US2 complete:
   - Developer A: User Story 3 (Compact Header — quick verification)
   - Developer B: User Story 4 (Layout Polish)
4. Final: Both developers run Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests MUST fail before implementing (Red-Green-Refactor per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is a frontend-only feature — no backend changes needed
- Only 1 existing CSS file in the project (`CombinedSlotSection.css`); `responsive.css` is the second
- Inline styles remain; class names are added alongside them for responsive CSS targeting
