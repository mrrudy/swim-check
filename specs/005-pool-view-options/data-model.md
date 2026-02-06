# Data Model: Pool View Display Options

**Feature Branch**: `005-pool-view-options`
**Date**: 2026-02-02

## Entities

### ViewPreferences (Extension of UserPreferences)

Extends the existing `UserPreferences` entity with view display settings.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| compactViewEnabled | boolean | Yes | true | Whether to show compact availability bar instead of lane grid |
| forwardSlotCount | number | Yes | 1 | Number of consecutive time slots to display (1-10) |

**Validation Rules**:
- `compactViewEnabled`: Must be boolean
- `forwardSlotCount`: Integer, minimum 1, maximum 10

**Relationships**:
- Belongs to User (1:1) - extends existing UserPreferences

---

### AvailabilitySummary (Computed/View Entity)

Aggregated availability data for a single time slot, used by compact view.

| Field | Type | Description |
|-------|------|-------------|
| availableCount | number | Count of available lanes |
| totalCount | number | Total number of lanes |
| percentage | number | `availableCount / totalCount` (0-1) |
| color | string | Computed HSL color based on percentage |

**Notes**:
- This is a computed entity, not persisted
- Derived from existing `PoolAvailabilityResponse.lanes[]`
- `color` is calculated at render time using HSL interpolation

---

### SlotViewData (Computed/View Entity)

Combined data for displaying a single slot in multi-slot view.

| Field | Type | Description |
|-------|------|-------------|
| timeSlot | TimeSlot | Start and end time for this slot |
| header | string | Display string like "08:00 - 08:30" |
| lanes | LaneAvailability[] | Full lane data for detailed view |
| summary | AvailabilitySummary | Aggregated data for compact view |
| status | 'loading' \| 'loaded' \| 'error' \| 'unavailable' | Fetch status |
| dataFreshness | DataFreshness | From API response |

**Notes**:
- Combines existing types with view-specific computed fields
- `status` tracks individual slot loading state

---

## State Transitions

### ViewPreferences State

```
Initial State
     │
     ▼
┌─────────────────────┐
│ Load from API       │ GET /preferences
│ (or use defaults)   │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ Active              │◄──────────────┐
│ - compactViewEnabled│               │
│ - forwardSlotCount  │               │
└─────────────────────┘               │
     │                                │
     │ User changes setting           │
     ▼                                │
┌─────────────────────┐               │
│ Saving              │ PATCH /prefs  │
│ (optimistic update) │───────────────┘
└─────────────────────┘
```

### Multi-Slot Fetch State

```
┌─────────────────────┐
│ Idle                │
└─────────────────────┘
     │ forwardSlotCount > 1 OR time change
     ▼
┌─────────────────────┐
│ Fetching            │ Promise.all(slots)
│ [slot1: loading]    │
│ [slot2: loading]    │
│ [slotN: loading]    │
└─────────────────────┘
     │ Each slot resolves independently
     ▼
┌─────────────────────┐
│ Partial             │
│ [slot1: loaded]     │
│ [slot2: loading]    │
│ [slotN: error]      │
└─────────────────────┘
     │ All slots resolved
     ▼
┌─────────────────────┐
│ Complete            │
│ [slot1: loaded]     │
│ [slot2: loaded]     │
│ [slotN: unavailable]│
└─────────────────────┘
```

---

## Type Definitions (TypeScript)

### Extended API Types (packages/shared/src/types/api.ts)

```typescript
// Extend existing UpdatePreferencesRequest
export interface UpdatePreferencesRequest {
  slotDurationMins?: number;
  compactViewEnabled?: boolean;    // NEW
  forwardSlotCount?: number;       // NEW
}

// Extend existing UserPreferencesResponse
export interface UserPreferencesResponse {
  id: string;
  slotDurationMins: number;
  compactViewEnabled: boolean;     // NEW
  forwardSlotCount: number;        // NEW
  createdAt: string;
  updatedAt: string;
}
```

### Frontend View Types (packages/frontend/src/types/views.ts)

```typescript
/** Aggregated availability for compact view */
export interface AvailabilitySummary {
  availableCount: number;
  totalCount: number;
  percentage: number;  // 0-1
}

/** Slot loading status */
export type SlotStatus = 'loading' | 'loaded' | 'error' | 'unavailable';

/** Data for a single slot in multi-slot view */
export interface SlotViewData {
  startTime: string;
  endTime: string;
  header: string;
  lanes: LaneAvailability[];
  summary: AvailabilitySummary;
  status: SlotStatus;
  dataFreshness?: DataFreshness;
  error?: string;
}

/** View preferences state */
export interface ViewPreferencesState {
  compactViewEnabled: boolean;
  forwardSlotCount: number;
  isLoading: boolean;
  isSaving: boolean;
}
```

### Color Utility Types (packages/frontend/src/utils/colorUtils.ts)

```typescript
/** HSL color representation */
export interface HSLColor {
  h: number;  // 0-360
  s: number;  // 0-100
  l: number;  // 0-100
}

/** Color thresholds for availability bar */
export interface ColorStop {
  percentage: number;  // 0-1
  color: HSLColor;
}
```

---

## Database Schema Changes

### user_preferences table (extend existing)

```sql
-- Add new columns to existing table
ALTER TABLE user_preferences
ADD COLUMN compact_view_enabled INTEGER NOT NULL DEFAULT 1;

ALTER TABLE user_preferences
ADD COLUMN forward_slot_count INTEGER NOT NULL DEFAULT 1
CHECK (forward_slot_count >= 1 AND forward_slot_count <= 10);
```

**Notes**:
- SQLite uses INTEGER for booleans (0=false, 1=true)
- CHECK constraint enforces valid range for forward_slot_count
- Default values match FR-009 requirements
