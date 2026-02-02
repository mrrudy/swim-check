# Implementation Plan: Time Slot Selection Synchronization with Auto-Refresh

**Branch**: `004-slot-sync-autorefresh` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-slot-sync-autorefresh/spec.md`

## Summary

Implement bidirectional synchronization between the manual time slot picker (`TimeSlotPicker`) and arrow navigation controls (`SlotNavigationButtons`), along with a 2-second debounce auto-refresh mechanism. The core approach involves creating a unified state management hook that serves as the single source of truth for both UI mechanisms, with state changes automatically triggering the debounced data refresh.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18.2.0
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12
**Storage**: N/A (frontend only, backend API exists)
**Testing**: Vitest with React Testing Library, @testing-library/jest-dom
**Target Platform**: Web browser (SPA)
**Project Type**: Web application (monorepo with packages/frontend)
**Performance Goals**: <100ms synchronization response (perceived instantaneous per SC-001/SC-002)
**Constraints**: 2-second debounce tolerance ±100ms (SC-003)
**Scale/Scope**: Single page enhancement (PoolDetail.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Test-First Development** | ✅ PASS | Tests will be written before implementation per workflow |
| **II. Readable Code** | ✅ PASS | Following existing patterns (hooks, components, utils) |
| **III. Simplicity** | ✅ PASS | Single shared state hook, minimal new abstractions |

**Pre-Design Gate Assessment**: All principles satisfied. Feature uses existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/004-slot-sync-autorefresh/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - frontend only)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   ├── TimeSlotPicker.tsx      # MODIFY: Accept controlled state
│   │   ├── SlotNavigationButtons.tsx  # EXISTS: Already takes props
│   │   └── ...
│   ├── hooks/
│   │   ├── useSlotNavigation.ts    # EXISTS: Extend or refactor
│   │   ├── useTimeSlotState.ts     # NEW: Unified state management
│   │   └── useDebounceRefresh.ts   # NEW: Debounce auto-refresh logic
│   ├── pages/
│   │   └── PoolDetail.tsx          # MODIFY: Integration point
│   └── utils/
│       └── timeSlotUtils.ts        # EXISTS: Utility functions
└── tests/                          # Vitest test files co-located
```

**Structure Decision**: Following existing monorepo structure with packages/frontend. New hooks added to hooks/ directory following established patterns. Tests co-located with source files.

## Complexity Tracking

> No violations identified. Design follows existing patterns with minimal new abstractions.

---

## Post-Design Constitution Re-Check

*Completed after Phase 1 design artifacts generated.*

| Principle | Status | Post-Design Assessment |
|-----------|--------|------------------------|
| **I. Test-First Development** | ✅ PASS | Test structure defined in quickstart.md, all new hooks/components will have tests written first |
| **II. Readable Code** | ✅ PASS | Design uses standard React patterns (controlled components, custom hooks), self-documenting interfaces in data-model.md |
| **III. Simplicity** | ✅ PASS | Only 2 new hooks added (useTimeSlotState, useDebounceRefresh), no external dependencies, reuses existing utilities |

**Post-Design Gate Assessment**: All principles satisfied. Design introduces minimal complexity:
- 2 new hooks (both follow existing patterns)
- 1 modified component (TimeSlotPicker → controlled)
- 1 modified hook (useSlotNavigation → stateless)
- 0 new external dependencies
- Uses standard React state management patterns

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | [plan.md](plan.md) | ✅ Complete |
| Research Document | [research.md](research.md) | ✅ Complete |
| Data Model | [data-model.md](data-model.md) | ✅ Complete |
| API Contracts | [contracts/README.md](contracts/README.md) | ✅ Complete (N/A - frontend only) |
| Quickstart Guide | [quickstart.md](quickstart.md) | ✅ Complete |

## Next Steps

Run `/speckit.tasks` to generate the implementation task list based on this plan.
