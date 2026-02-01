# Data Model: Pool Availability Slot Navigation

**Feature**: 002-slot-navigation
**Date**: 2026-02-01

## Overview

This feature primarily adds **UI state management** for slot navigation. No new persistent entities are required; the feature extends existing types with navigation-specific interfaces.

## Existing Entities (Reference)

### TimeSlot (from models.ts)
```typescript
interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}
```
- Used for API requests and responses
- 30-minute resolution (05:00 to 22:00)

### UserPreferences (from models.ts)
```typescript
interface UserPreferences {
  id: string;
  slotDurationMins: number; // Default: 60, saved per user
  createdAt: Date;
  updatedAt: Date;
}
```
- Stores user's preferred slot duration
- Duration adjustment will update this preference

## New Types (Frontend State)

### SlotNavigationState
```typescript
/**
 * Represents the current state of slot navigation in the UI
 */
interface SlotNavigationState {
  /** Index into TIME_OPTIONS array (0-34) */
  currentSlotIndex: number;

  /** Currently selected start time (HH:MM) */
  startTime: string;

  /** Currently selected end time (HH:MM) */
  endTime: string;

  /** Current duration in minutes (30-480) */
  duration: number;

  /** Whether the availability view container has keyboard focus */
  hasFocus: boolean;
}
```

**Validation Rules**:
- `currentSlotIndex`: Must be 0-34 (valid TIME_OPTIONS indices)
- `startTime`: Must be HH:MM format, on 30-min boundary, 05:00-22:00
- `endTime`: Must be > startTime, ≤ 22:00
- `duration`: Minimum 30, maximum determined by pool closing or next booking

### NavigationBoundaries
```typescript
/**
 * Computed boundaries for navigation actions
 */
interface NavigationBoundaries {
  /** Can navigate to previous slot (not at first slot) */
  canNavigatePrevious: boolean;

  /** Can navigate to next slot (not at last valid slot) */
  canNavigateNext: boolean;

  /** Can extend duration (won't exceed closing/conflict) */
  canExtend: boolean;

  /** Can reduce duration (duration > 30 minutes) */
  canReduce: boolean;

  /** Reason if extend is blocked */
  extendBlockedReason?: 'pool_closing' | 'booking_conflict';
}
```

### SlotNavigationCallbacks
```typescript
/**
 * Actions that can be performed on slot navigation
 */
interface SlotNavigationCallbacks {
  navigatePrevious: () => void;
  navigateNext: () => void;
  extendDuration: () => void;
  reduceDuration: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  setFocus: (hasFocus: boolean) => void;
}
```

## State Transitions

### Slot Navigation (Left/Right)

```
┌─────────────────────────────────────────────────────────────────┐
│  TIME_OPTIONS: [05:00, 05:30, 06:00, ..., 21:30, 22:00]        │
│                   ↑                                     ↑       │
│               index 0                               index 34    │
└─────────────────────────────────────────────────────────────────┘

State Transition (navigateNext):
  precondition: currentSlotIndex < 34
  action: currentSlotIndex++
  effect: startTime = TIME_OPTIONS[currentSlotIndex]
          endTime = recalculated based on duration
  boundary: if currentSlotIndex === 34, canNavigateNext = false

State Transition (navigatePrevious):
  precondition: currentSlotIndex > 0
  action: currentSlotIndex--
  effect: startTime = TIME_OPTIONS[currentSlotIndex]
          endTime = recalculated based on duration
  boundary: if currentSlotIndex === 0, canNavigatePrevious = false
```

### Duration Adjustment (Up/Down)

```
State Transition (extendDuration):
  precondition: endTime + 30min ≤ 22:00 AND no booking conflict
  action: duration += 30
  effect: endTime = calculateEndTime(startTime, duration)
  boundary: if newEndTime > 22:00 OR conflict, canExtend = false

State Transition (reduceDuration):
  precondition: duration > 30
  action: duration -= 30
  effect: endTime = calculateEndTime(startTime, duration)
  boundary: if duration === 30, canReduce = false
```

## Constants

```typescript
/** Pool operating hours */
const SLOT_CONSTANTS = {
  /** First available time slot */
  FIRST_SLOT: '05:00',

  /** Last available time slot (pool closing) */
  LAST_SLOT: '22:00',

  /** Minimum booking duration in minutes */
  MIN_DURATION: 30,

  /** Maximum booking duration in minutes */
  MAX_DURATION: 480, // 8 hours

  /** Duration adjustment step in minutes */
  DURATION_STEP: 30,

  /** Total number of time slots */
  SLOT_COUNT: 35, // (22-5)*2 + 1

  /** First slot index */
  FIRST_SLOT_INDEX: 0,

  /** Last slot index */
  LAST_SLOT_INDEX: 34,
} as const;
```

## Relationship to Existing Data

```
┌─────────────────────────────────────────────────────────────────┐
│                     PoolDetail Page                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              TimeSlotPicker (existing)                   │    │
│  │    [Date] [Start Time ▼] [End Time ▼] Duration: Xh      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ onChange(date, startTime, endTime)│
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         SlotNavigationState (NEW)                        │    │
│  │    currentSlotIndex, startTime, endTime, duration        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Keyboard/Button events            │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         SlotNavigationButtons (NEW)                      │    │
│  │    [◀] [HH:MM] [▶]    [▲] [Duration] [▼]                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Updates UserPreferences.duration  │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              LaneGrid (existing)                         │    │
│  │         Shows availability for selected slot             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## No Database Changes Required

This feature operates entirely on frontend state:
- Slot index is computed, not stored
- Duration preference already persisted via existing `UserPreferences`
- Navigation boundaries computed from slot list and availability data

The existing `PATCH /api/v1/preferences` endpoint handles duration persistence.
