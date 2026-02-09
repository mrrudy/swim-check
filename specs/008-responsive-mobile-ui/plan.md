# Implementation Plan: Responsive Mobile UI

**Branch**: `008-responsive-mobile-ui` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-responsive-mobile-ui/spec.md`

## Summary

Make the Swim Check web UI mobile-friendly by: (1) collapsing the navigation menu into a hamburger button on small screens (<800px), (2) compacting the header/title to save vertical space, (3) adding invisible edge-zone overlays on the slot display area for touch-friendly navigation (5% edges for Prev/Next/+30m/-30m), and (4) ensuring all pages reflow cleanly without horizontal scrolling down to 320px viewports. This is a frontend-only feature requiring no backend changes. The approach uses CSS media queries and a new React component for edge-zone overlays, consistent with the existing inline-styles pattern.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18.2.0
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12
**Storage**: N/A (frontend-only feature, no data persistence changes)
**Testing**: Vitest + React Testing Library (jsdom)
**Target Platform**: Web browsers (desktop + mobile), minimum viewport 320px
**Project Type**: Web application (monorepo: `packages/frontend/`)
**Performance Goals**: Edge-zone feedback <100ms, menu animation <200ms (per SC-005, SC-006)
**Constraints**: Header height <=48px on mobile (SC-004), no horizontal scrollbar 320px-1920px (SC-001), existing keyboard shortcuts must continue working (SC-007)
**Scale/Scope**: 4 pages (Home, Search, PoolDetail, ScrapingStatus), ~10 components affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Test-First Development** | PASS | Tests will be written for: hamburger menu toggle, edge-zone click detection, responsive breakpoint behavior. React Testing Library supports viewport simulation via container sizing. |
| **II. Readable Code** | PASS | New components will follow existing naming patterns (e.g., `HamburgerMenu.tsx`, `EdgeZoneOverlay.tsx`). Inline styles consistent with codebase convention. |
| **III. Simplicity** | PASS | No new dependencies needed. CSS media queries via a single shared CSS file for breakpoint-based rules. Edge zones implemented as positioned div overlays with click handlers. No gesture libraries or complex animation frameworks. |

**Gate Result**: PASS - All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/008-responsive-mobile-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (component model)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (component interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   ├── HamburgerMenu.tsx       # NEW - collapsible navigation menu
│   │   ├── EdgeZoneOverlay.tsx      # NEW - edge-zone touch navigation
│   │   ├── SlotNavigationButtons.tsx  # EXISTING - minor responsive tweaks
│   │   ├── LaneGrid.tsx              # EXISTING - responsive grid adjustments
│   │   ├── PoolCard.tsx              # EXISTING - full-width on mobile
│   │   ├── CombinedSlotSection.tsx   # EXISTING - responsive tweaks
│   │   └── CombinedSlotSection.css   # EXISTING - add responsive rules
│   ├── pages/
│   │   ├── Home.tsx                  # EXISTING - wrap slot area with edge zones
│   │   ├── PoolDetail.tsx            # EXISTING - wrap slot area with edge zones
│   │   ├── Search.tsx                # EXISTING - responsive layout tweaks
│   │   └── ScrapingStatus.tsx        # EXISTING - responsive layout tweaks
│   ├── hooks/
│   │   └── useMediaQuery.ts          # NEW - responsive breakpoint hook
│   ├── App.tsx                       # MODIFY - extract header into responsive layout
│   └── responsive.css                # NEW - media query breakpoint styles
└── tests/
    ├── components/
    │   ├── HamburgerMenu.test.tsx    # NEW
    │   └── EdgeZoneOverlay.test.tsx  # NEW
    └── hooks/
        └── useMediaQuery.test.ts    # NEW
```

**Structure Decision**: Web application structure (existing monorepo under `packages/frontend/`). This feature is frontend-only; no backend changes needed. New files are 2 components, 1 hook, 1 CSS file, and 3 test files.

## Constitution Check — Post-Design Re-evaluation

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Test-First Development** | PASS | 3 new test files planned: `useMediaQuery.test.ts`, `HamburgerMenu.test.tsx`, `EdgeZoneOverlay.test.tsx`. Each tests specific behaviors (toggle, click-outside, edge-zone callbacks). Test infrastructure (Vitest + RTL) already exists. |
| **II. Readable Code** | PASS | Component names are descriptive (`HamburgerMenu`, `EdgeZoneOverlay`, `useMediaQuery`). Props mirror existing patterns (e.g., `EdgeZoneOverlayProps` follows `SlotNavigationButtonsProps` naming). State transitions documented in data-model.md. |
| **III. Simplicity** | PASS | Zero new dependencies. 2 new components + 1 hook + 1 CSS file. Edge-zone z-index approach eliminates need for coordinate math. `useSyncExternalStore` is a standard React 18 API (not a third-party hook). No over-engineering: hamburger is a simple dropdown, not a side drawer. |

**Post-Design Gate Result**: PASS — Design adheres to all constitutional principles. No violations.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
