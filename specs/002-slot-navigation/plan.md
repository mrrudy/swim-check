# Implementation Plan: Pool Availability Slot Navigation

**Branch**: `002-slot-navigation` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-slot-navigation/spec.md`

## Summary

Add keyboard navigation (arrow keys) and UI buttons to the pool availability view enabling users to quickly navigate between time slots (left/right) and adjust booking duration in 30-minute increments (up/down). This enhances the existing TimeSlotPicker and PoolDetail components with accessible, efficient slot selection.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js 20 LTS (backend), TypeScript with React 18.2 (frontend)
**Primary Dependencies**: Express.js 4.18.2 (backend), React 18.2.0, React Router DOM 6.21.3 (frontend), Vite 5.0.12 (build)
**Storage**: sql.js 1.10.0 (SQLite in JavaScript) for user preferences and favorites
**Testing**: Vitest 1.2.0
**Target Platform**: Web browser (React SPA), API proxy to localhost:3000
**Project Type**: Web application (monorepo with packages/backend, packages/frontend, packages/shared)
**Performance Goals**: Visual feedback within 100ms of keyboard/button input
**Constraints**: Must work with existing TimeSlotPicker 30-minute resolution (05:00-22:00 range)
**Scale/Scope**: Single-user preferences, integration with existing availability view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development (NON-NEGOTIABLE)
- **Status**: WILL COMPLY
- **Plan**: Write Vitest tests for keyboard navigation hooks and slot calculation logic before implementation
- **Test Cases Required**:
  - Navigation boundary detection (first/last slot)
  - Duration extension/reduction calculations
  - Keyboard event handler unit tests
  - Component integration tests

### II. Readable Code
- **Status**: WILL COMPLY
- **Plan**:
  - Create dedicated `useSlotNavigation` hook with clear function names
  - Self-documenting slot state management
  - Keyboard shortcuts documented inline with UI hints

### III. Simplicity
- **Status**: WILL COMPLY
- **Plan**:
  - Extend existing TimeSlotPicker rather than creating new component
  - Use React's built-in keyboard event handling (no extra libraries)
  - Reuse existing time-slot service calculations on backend
  - Minimal state: selected slot index + adjusted duration

## Project Structure

### Documentation (this feature)

```text
specs/002-slot-navigation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   └── src/
│       ├── services/
│       │   └── time-slot.ts          # Existing - add slot navigation helpers
│       └── routes/
│           └── preferences.ts        # Existing - may extend for slot state
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TimeSlotPicker.tsx    # Existing - add keyboard handlers
│       │   ├── SlotNavigationButtons.tsx  # New - navigation UI buttons
│       │   └── KeyboardHints.tsx     # New - shortcut hints display
│       ├── hooks/
│       │   └── useSlotNavigation.ts  # New - navigation logic hook
│       └── pages/
│           └── PoolDetail.tsx        # Existing - integrate navigation
└── shared/
    └── src/
        └── types/
            └── models.ts             # Existing - add slot navigation types
```

**Structure Decision**: Follows existing web application structure. New components added to frontend/src/components, new hook in frontend/src/hooks (directory to be created), shared types extended in packages/shared.

## Complexity Tracking

> No Constitution violations requiring justification. Feature uses standard React patterns with minimal new abstractions.

| Consideration | Decision | Rationale |
|---------------|----------|-----------|
| Custom hook vs inline logic | Custom `useSlotNavigation` hook | Encapsulates keyboard + state logic, testable in isolation, reusable |
| New component vs prop extension | Separate `SlotNavigationButtons` + integration | Separation of concerns, easier testing |
