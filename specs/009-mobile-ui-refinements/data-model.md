# Data Model: Mobile UI Refinements

**Feature**: 009-mobile-ui-refinements | **Date**: 2026-02-08

## Overview

This is a frontend-only feature. No database entities, API models, or persistent data structures are introduced or modified. All changes are to component state and CSS presentation.

## Component State Changes

### EdgeZoneOverlay — New State

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `showEdgeHints` | `boolean` | `false` | Whether to render persistent hint arrows at edge zones |

**State Transitions**:
- `false` → `true`: 3 seconds after `dataLoaded` prop becomes `true` (via `setTimeout`)
- `true` → `false`: When `dataLoaded` becomes `false` (data refreshing/loading) — timer resets

**Dependencies**: Timer cleanup on unmount via `useEffect` return.

### EdgeZoneOverlay — New/Modified Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dataLoaded` | `boolean` | Yes (new) | Signals that availability data has been rendered, triggering the 3s hint timer |

### PoolDetail — No New State

The refresh button reordering uses CSS `order` only. No React state changes needed.

### TimeSlotPicker — No New State

The single-row layout fix is CSS-only. No React state changes needed.

## CSS Class Inventory

### New CSS Rules (in responsive.css `@media (max-width: 799px)`)

| Selector | Properties | Purpose |
|----------|-----------|---------|
| `.slot-nav-container` | `display: none` | Hide slot navigation box on mobile |
| `.pool-detail-actions` | `order: 10` | Move refresh/cache info below data grid |
| `.time-slot-picker-responsive` | `flex-direction: row !important` | Override vertical stacking |
| `.time-slot-picker-responsive input[type="date"]` | `min-width: clamp(100px, 28vw, 150px)` | Fluid date input sizing |
| `.time-slot-picker-responsive select` | `min-width: clamp(65px, 18vw, 100px)` | Fluid time select sizing |

### New CSS Rules (global)

| Selector | Properties | Purpose |
|----------|-----------|---------|
| `.edge-zone-hint` | `opacity: 0.25; pointer-events: none` | Persistent hint arrow styling |
| `@keyframes hint-fade-in` | `opacity: 0 → 0.25` | Smooth appearance animation for hints |

## No Database Changes

No tables, columns, indexes, or migrations are affected by this feature.
