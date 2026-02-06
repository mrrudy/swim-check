# Implementation Plan: Pool View Display Options

**Branch**: `005-pool-view-options` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-pool-view-options/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add two display options to the pool detail view: (1) a compact view that shows lane availability as a color-coded percentage bar instead of individual lane cards, and (2) a multi-slot forward view that displays multiple consecutive time slots stacked vertically. Both preferences persist across sessions using the existing preferences API.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18.2.0 (frontend only feature)
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12, @swim-check/shared (monorepo types)
**Storage**: Backend REST API `/api/v1/preferences` endpoint (existing pattern for duration preferences)
**Testing**: Vitest + @testing-library/react (existing test infrastructure)
**Target Platform**: Web browser (responsive, works on desktop and mobile)
**Project Type**: Web application (frontend-only changes to existing React app)
**Performance Goals**: View option toggling updates display within 200ms (FR-006); multi-slot data fetching in parallel
**Constraints**: Forward slot maximum capped at 10 (FR-010); smooth color interpolation (FR-004)
**Scale/Scope**: Single page enhancement (PoolDetail.tsx); ~3-5 new/modified components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development (NON-NEGOTIABLE) ✅ PASS

- **Compliance**: Feature spec includes detailed acceptance scenarios for all user stories
- **Plan**: Tests will be written first for:
  - CompactAvailabilityBar component (color interpolation, fill percentage, text display)
  - MultiSlotView component (stacking, headers, loading states)
  - ViewPreferences persistence (save/restore cycle)
- **Verification**: Implementation tasks will follow Red-Green-Refactor cycle

### II. Readable Code ✅ PASS

- **Compliance**: Plan follows existing codebase patterns (inline styles, controlled components, descriptive prop names)
- **Plan**:
  - Component names clearly describe purpose (CompactAvailabilityBar, MultiSlotView, ViewPreferencesControls)
  - Color calculation logic will be extracted to pure utility function with clear documentation
  - State will follow existing patterns in useTimeSlotState hook

### III. Simplicity ✅ PASS

- **Compliance**: Minimal solution leveraging existing infrastructure:
  - Reuses existing `/preferences` API endpoint (extend, not replace)
  - Reuses existing `getPoolAvailability()` API calls (multiple calls for multi-slot)
  - Reuses existing LaneGrid component (toggle between views)
- **Plan**: No new dependencies, no new API endpoints, no premature abstractions
- **Justification**: Color interpolation is only added complexity; required by FR-004 for smooth transitions

## Project Structure

### Documentation (this feature)

```text
specs/005-pool-view-options/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── components/
│   ├── LaneGrid.tsx           # Existing - will add compact mode toggle
│   ├── CompactAvailabilityBar.tsx   # NEW - percentage bar component
│   ├── MultiSlotView.tsx      # NEW - stacked slots container
│   └── ViewPreferencesPanel.tsx     # NEW - settings controls
├── hooks/
│   ├── useTimeSlotState.ts    # Existing - may extend for view prefs
│   └── useViewPreferences.ts  # NEW - view preferences state hook
├── pages/
│   └── PoolDetail.tsx         # Existing - integrate new components
├── services/
│   └── api.ts                 # Existing - extend preferences methods
├── utils/
│   ├── timeSlotUtils.ts       # Existing - slot calculations
│   └── colorUtils.ts          # NEW - availability color interpolation
└── test/
    └── setup.ts               # Existing test setup

packages/shared/src/types/
└── api.ts                     # Existing - extend ViewPreferences type
```

**Structure Decision**: Web application with monorepo structure. Frontend-only feature changes to existing `packages/frontend/` directory. No backend changes required as preferences API already exists and can be extended.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Color interpolation utility | FR-004 requires smooth color transitions | Discrete color steps would look jarring at 75%, 25% thresholds |
| Multiple API calls for forward view | Each slot needs separate availability data | Backend aggregation would require new endpoint (more complexity) |

*No fundamental constitution violations. Above items are acceptable complexity per Simplicity principle ("complexity is a cost that must be consciously accepted").*

## Constitution Check - Post-Design Re-evaluation

*Re-evaluated after Phase 1 design completion.*

### I. Test-First Development ✅ CONFIRMED

- **Design Artifacts**: Component interfaces defined in `contracts/component-interfaces.ts`
- **Test Targets Identified**:
  - `colorUtils.ts`: Pure function `calculateAvailabilityColor(percentage)` - easily unit tested
  - `CompactAvailabilityBar`: Render tests for color, fill %, text display
  - `MultiSlotView`: Tests for slot count, stacking, loading states
  - `useViewPreferences`: Hook tests for load/save cycle
- **No Design Conflicts**: All components designed with testability in mind (pure props, no side effects)

### II. Readable Code ✅ CONFIRMED

- **Component Names**: Clear and descriptive (`CompactAvailabilityBar`, `MultiSlotView`, `ViewPreferencesPanel`)
- **Interface Documentation**: All props documented in `component-interfaces.ts`
- **Utility Functions**: `colorUtils.ts` will contain pure, documented functions
- **Data Flow**: Follows existing patterns - PoolDetail manages state, passes props to children

### III. Simplicity ✅ CONFIRMED

- **Reuse Verified**:
  - Preferences API extension (not replacement) - see `contracts/preferences-extension.yaml`
  - Existing `getPoolAvailability()` for multi-slot data
  - Existing `LaneGrid` component preserved for detailed view
- **No New Dependencies**: Design uses only existing React/TypeScript
- **No New API Endpoints**: Only extends existing `/preferences` schema
- **Single-Page Scope**: All changes contained to PoolDetail and its children

### Design Decision Summary

| Decision | Constitution Alignment |
|----------|----------------------|
| HSL color interpolation | Simplicity: Minimal code, no library needed |
| Parallel API calls | Simplicity: Reuses existing endpoint |
| Backend schema extension | Simplicity: Extends, not replaces |
| Component isolation | Readability: Clear responsibility boundaries |
| Type-first design | Test-First: Interfaces enable test writing |

**Post-Design Status**: ✅ All constitution principles satisfied. Ready for task generation.
