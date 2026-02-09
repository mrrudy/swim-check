# Implementation Plan: Mobile UI Refinements

**Branch**: `009-mobile-ui-refinements` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-mobile-ui-refinements/spec.md`

## Summary

Refine the mobile (<800px) layout of the pool detail page by: (1) hiding the slot navigation buttons box (since edge zones duplicate its functionality), (2) adding delayed visual hints for edge zone navigation, (3) moving the refresh button and cache info below the availability data, and (4) keeping date/start/end time inputs in a single row instead of stacking vertically. All changes are CSS and component-level modifications to the existing React frontend, with no backend or data model changes.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18.2.0
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12
**Storage**: N/A (frontend-only feature, no data persistence changes)
**Testing**: Vitest (existing test setup), React Testing Library
**Target Platform**: Modern browsers (mobile and desktop), minimum viewport 280px
**Project Type**: Web application (monorepo: packages/frontend)
**Performance Goals**: Edge zone hints appear within 3s ± 500ms of data load; no layout shifts or jank during responsive transitions
**Constraints**: All changes scoped to viewports < 800px; desktop layout (≥ 800px) must remain unchanged
**Scale/Scope**: 4-6 files modified (CSS + 3-4 components), no new dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development (NON-NEGOTIABLE)

- **Status**: PASS
- **Plan**: Tests for each user story will be written before implementation:
  - Test that `.slot-nav-container` is hidden when `useMediaQuery('(max-width: 799px)')` returns true
  - Test that edge zone hints appear after 3-second delay when data is loaded and `can*` props are true
  - Test that edge zone hints do NOT appear for disabled zones
  - Test that refresh button/cache info renders after the data grid on mobile
  - Test that time inputs remain in a row (no `flex-direction: column`) on mobile
  - Existing edge zone and keyboard navigation tests must continue passing

### Principle II: Readable Code

- **Status**: PASS
- **Plan**: Changes use existing patterns (CSS classes with responsive overrides, `useMediaQuery` hook). New hint state uses descriptive names (`showEdgeHints`, `hintTimerRef`). CSS follows existing naming conventions (`.edge-zone-hint`, `.slot-nav-container`).

### Principle III: Simplicity

- **Status**: PASS
- **Plan**:
  - Hide slot nav: single CSS rule (`display: none`)
  - Edge hints: minimal state (boolean + timer) in existing EdgeZoneOverlay component
  - Move refresh: conditional rendering based on existing `useMediaQuery` hook (render in different position)
  - Time inputs: override existing CSS rule (remove `flex-direction: column`, reduce min-widths)
  - No new dependencies, no new abstractions, no new components needed

**GATE RESULT**: All principles satisfied. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/009-mobile-ui-refinements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - frontend-only feature)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (no API contracts - frontend-only)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   ├── EdgeZoneOverlay.tsx      # Modified: add hint visibility state + rendering
│   │   ├── EdgeZoneOverlay.test.tsx  # Modified: add hint visibility tests
│   │   ├── SlotNavigationButtons.tsx # Unchanged (hidden via CSS)
│   │   ├── TimeSlotPicker.tsx       # Unchanged (layout fixed via CSS)
│   │   └── LaneGrid.tsx            # Unchanged
│   ├── pages/
│   │   ├── PoolDetail.tsx           # Modified: reorder refresh button on mobile
│   │   └── Home.tsx                 # Modified: hide slot nav on mobile (if present)
│   ├── hooks/
│   │   └── useMediaQuery.ts         # Unchanged (already exists)
│   └── responsive.css               # Modified: add/update responsive rules
└── tests/                           # New tests for mobile refinements
```

**Structure Decision**: Existing web application structure with `packages/frontend/` unchanged. All modifications are within existing files plus CSS additions. No new components needed.

## Complexity Tracking

> No violations. All changes align with constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

### Principle I: Test-First Development — PASS

All design artifacts are testable with existing tooling:
- **CSS changes** (hide nav, reorder, input layout): Testable via computed style assertions or DOM presence checks with media query mocking
- **Hint timer** (EdgeZoneOverlay): Testable via `vi.useFakeTimers()` + `vi.advanceTimersByTime(3000)`
- **Hint conditional rendering**: Testable by varying `can*` props and asserting hint element presence
- No untestable patterns introduced.

### Principle II: Readable Code — PASS

Design uses established codebase patterns:
- CSS media query overrides in `responsive.css` (same file, same pattern)
- `useState` + `useEffect` for component state (standard React)
- Descriptive class names (`.pool-detail-actions`, `.edge-zone-hint`)

### Principle III: Simplicity — PASS

Final design complexity assessment:
- 3 of 4 changes are CSS-only (zero JavaScript)
- 1 change adds ~15 lines of React state logic (hint timer in EdgeZoneOverlay)
- No new components, hooks, or dependencies
- No abstractions or indirection layers

**POST-DESIGN GATE RESULT**: All principles satisfied. Ready for task generation (`/speckit.tasks`).
