# Implementation Plan: Favorites Combined Availability View

**Branch**: `007-favorites-combined-view` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-favorites-combined-view/spec.md`

## Summary

Add a combined availability view to the Home/favorites page that groups all favorite pools by time slot. Users can compare availability across pools at a glance, with support for multi-slot forward view, compact/detailed toggle, and full keyboard navigation—all using existing proven components and hooks.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (Node.js 20 LTS backend, React 18 frontend)
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12, Express.js 4.18.2
**Storage**: SQLite via sql.js (`./swim-check.db`) - existing tables sufficient
**Testing**: Jest, React Testing Library
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend + backend monorepo)
**Performance Goals**: Page load with 2+ favorites and availability data < 5 seconds; navigation updates < 2 seconds; view toggle < 200ms
**Constraints**: Support 10+ favorites without layout issues; graceful degradation for missing availability data
**Scale/Scope**: Single-user MVP; up to 20 favorite pools; 10 consecutive time slots

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|-----------|--------|---------------|
| **I. Test-First Development** | ✅ PASS | Tests will be written for new components and modified hooks before implementation |
| **II. Readable Code** | ✅ PASS | Feature extends existing patterns with self-documenting component names |
| **III. Simplicity** | ✅ PASS | Maximum reuse of existing components/hooks; minimal new abstractions |

**Pre-Design Gate**: PASSED - All core principles satisfied with existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/007-favorites-combined-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (no new API contracts needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/backend/
├── src/
│   ├── api/             # No changes needed - existing endpoints sufficient
│   ├── db/              # No changes needed - existing queries sufficient
│   └── services/        # No changes needed
└── tests/               # Backend tests (no new tests needed)

packages/frontend/
├── src/
│   ├── components/
│   │   ├── CompactAvailabilityBar.tsx    # Reuse as-is
│   │   ├── LaneGrid.tsx                  # Reuse as-is
│   │   ├── MultiSlotView.tsx             # Reuse as-is
│   │   ├── SlotSection.tsx               # Reuse as-is
│   │   ├── SlotNavigationButtons.tsx     # Reuse as-is
│   │   ├── TimeSlotPicker.tsx            # Reuse as-is
│   │   └── CombinedSlotSection.tsx       # NEW: multiple pools per slot
│   ├── hooks/
│   │   ├── useTimeSlotState.ts           # Reuse as-is
│   │   ├── useSlotNavigation.ts          # Reuse as-is
│   │   ├── useViewPreferences.ts         # Reuse as-is
│   │   ├── useMultiSlotData.ts           # Reuse as-is
│   │   └── useCombinedFavoritesData.ts   # NEW: fetch all favorites per slot
│   ├── pages/
│   │   └── Home.tsx                      # MODIFY: add combined view
│   └── types/
│       └── views.ts                      # EXTEND: CombinedSlotData type
└── tests/
    └── components/                        # NEW: tests for CombinedSlotSection
```

**Structure Decision**: Web application structure matches existing codebase. New code follows established patterns in `packages/frontend/src/`.

## Complexity Tracking

> No constitution violations. Feature is implemented via composition of existing components.

| Aspect | Approach | Why Simple |
|--------|----------|------------|
| Data fetching | Parallel API calls per favorite | Reuses existing `useMultiSlotData` pattern |
| State management | Existing hooks | `useTimeSlotState`, `useViewPreferences` already work |
| Navigation | Existing hooks | `useSlotNavigation` already handles keyboard |
| Display | Compose existing components | `SlotSection`, `CompactAvailabilityBar`, `LaneGrid` |

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Justification |
|-----------|--------|---------------------------|
| **I. Test-First Development** | ✅ PASS | New components (`CombinedSlotSection`, `useCombinedFavoritesData`) will have tests before implementation. Existing component tests remain valid. |
| **II. Readable Code** | ✅ PASS | Design follows existing patterns: hooks with descriptive names (`useCombinedFavoritesData`), components with single responsibility (`CombinedSlotSection`). |
| **III. Simplicity** | ✅ PASS | Minimal new code: 1 new hook, 1 new component, 3 new types. Maximum reuse of 6 existing hooks and 6 existing components. No backend changes. |

**Post-Design Gate**: PASSED - Design adheres to all constitution principles.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/007-favorites-combined-view/plan.md` | ✅ Complete |
| Research | `specs/007-favorites-combined-view/research.md` | ✅ Complete |
| Data Model | `specs/007-favorites-combined-view/data-model.md` | ✅ Complete |
| API Contracts | `specs/007-favorites-combined-view/contracts/README.md` | ✅ Complete (no new endpoints) |
| Quickstart Guide | `specs/007-favorites-combined-view/quickstart.md` | ✅ Complete |

---

## Next Steps

Run `/speckit.tasks` to generate the task breakdown for implementation.
