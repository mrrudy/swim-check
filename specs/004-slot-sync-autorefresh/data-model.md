# Data Model: Time Slot Selection Synchronization with Auto-Refresh

**Date**: 2026-02-02
**Feature**: 004-slot-sync-autorefresh

## Overview

This feature is frontend-only and doesn't modify backend data models. The data model defines React state structures and TypeScript interfaces for the unified time slot selection state.

## State Entities

### 1. TimeSlotState (Primary State Entity)

The single source of truth for time slot selection, shared between `TimeSlotPicker` and `SlotNavigationButtons`.

```typescript
/**
 * Represents the current time slot selection state.
 * This is the shared state between all selection UI mechanisms.
 *
 * @entity TimeSlotSelection (from spec)
 */
interface TimeSlotState {
  /** Selected date in YYYY-MM-DD format */
  date: string;

  /** Start time in HH:MM format (05:00-22:00 range) */
  startTime: string;

  /** End time in HH:MM format (05:30-22:00 range, must be > startTime) */
  endTime: string;

  /** Duration in minutes (derived: endTime - startTime, 30-480 range) */
  duration: number;

  /** Slot index for navigation (derived: 0-34 based on startTime) */
  slotIndex: number;
}
```

**Validation Rules**:
- `date`: Must be today or future date
- `startTime`: Must be in TIME_OPTIONS (05:00-22:00 at 30-min intervals)
- `endTime`: Must be > startTime and <= 22:00
- `duration`: Minimum 30 minutes, maximum 480 minutes, increments of 30
- `slotIndex`: 0-34 (35 slots from 05:00 to 22:00)

**State Transitions**:

| Trigger | startTime | endTime | duration | slotIndex |
|---------|-----------|---------|----------|-----------|
| Manual start time change | Updated | Recalculated | Preserved | Recalculated |
| Manual end time change | Preserved | Updated | Recalculated | Preserved |
| Manual date change | Preserved | Preserved | Preserved | Preserved |
| Arrow navigate prev | -30 min | -30 min | Preserved | -1 |
| Arrow navigate next | +30 min | +30 min | Preserved | +1 |
| Arrow extend duration | Preserved | +30 min | +30 min | Preserved |
| Arrow reduce duration | Preserved | -30 min | -30 min | Preserved |

---

### 2. RefreshState (Auto-Refresh State Entity)

Tracks the debounce timer and refresh execution state.

```typescript
/**
 * Represents the auto-refresh mechanism state.
 *
 * @entity RefreshTimer (from spec)
 */
interface RefreshState {
  /** Timer ID for the pending debounce, null if no timer active */
  pendingTimerId: ReturnType<typeof setTimeout> | null;

  /** Whether a refresh API call is currently in flight */
  isRefreshing: boolean;

  /** AbortController for canceling in-flight requests */
  abortController: AbortController | null;

  /** Timestamp of last successful refresh (for staleness display) */
  lastRefreshedAt: Date | null;

  /** Whether initial page load refresh has occurred */
  hasInitialRefresh: boolean;
}
```

**State Transitions**:

| Event | pendingTimerId | isRefreshing | abortController |
|-------|----------------|--------------|-----------------|
| Time slot changes | New timer (old cleared) | Unchanged | Unchanged |
| Debounce completes | null | true | New controller |
| API request succeeds | Unchanged | false | null |
| API request fails | Unchanged | false | null |
| New refresh while in-flight | New timer | true | Previous aborted, new created |
| Page load complete | null | true | New controller |

---

### 3. AvailabilityState (Existing - No Changes)

The existing availability state from the current implementation. Referenced for completeness.

```typescript
/**
 * @entity AvailabilityData (from spec)
 * Existing type - no modifications needed
 */
interface AvailabilityState {
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
  scrapedAt?: string;
  availableLaneCount: number;
  totalLaneCount: number;
}
```

---

## Component Interface Changes

### TimeSlotPicker (Controlled)

```typescript
/**
 * Props for the controlled TimeSlotPicker component.
 * Replaces internal state with props-driven values.
 */
interface TimeSlotPickerProps {
  // Controlled values (required)
  date: string;
  startTime: string;
  endTime: string;

  // Change handlers
  onDateChange: (date: string) => void;
  onStartTimeChange: (startTime: string) => void;
  onEndTimeChange: (endTime: string) => void;

  // Optional: Loading state to disable inputs during refresh
  disabled?: boolean;
}
```

### useSlotNavigation (Controlled)

```typescript
/**
 * Props for the stateless navigation hook.
 * Receives current state and returns action functions.
 */
interface UseSlotNavigationProps {
  // Current state (controlled from parent)
  startTime: string;
  duration: number;
  maxEndTime?: string;

  // Callback when navigation action occurs
  onNavigate: (startTime: string, endTime: string, duration: number) => void;
}

/**
 * Return type for the navigation hook.
 * Provides computed values and action functions.
 */
interface UseSlotNavigationReturn {
  // Computed values
  slotIndex: number;
  endTime: string;

  // Boundary flags
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;

  // Actions (no internal state changes, just call onNavigate)
  navigatePrevious: () => void;
  navigateNext: () => void;
  extendDuration: () => void;
  reduceDuration: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}
```

---

## New Hook Interfaces

### useTimeSlotState

```typescript
/**
 * Unified state management hook for time slot selection.
 * Single source of truth consumed by both UI mechanisms.
 */
interface UseTimeSlotStateProps {
  /** Default duration from user preferences (fetched from API) */
  defaultDuration?: number;
}

interface UseTimeSlotStateReturn {
  // State values
  state: TimeSlotState;

  // State setters (for controlled components)
  setDate: (date: string) => void;
  setStartTime: (startTime: string) => void;
  setEndTime: (endTime: string) => void;

  // Navigation callback (for useSlotNavigation)
  handleNavigation: (startTime: string, endTime: string, duration: number) => void;

  // Initialization flag
  isInitialized: boolean;
}
```

### useDebounceRefresh

```typescript
/**
 * Debounced auto-refresh hook for time slot changes.
 */
interface UseDebounceRefreshProps {
  /** Current time slot state to watch for changes */
  timeSlotState: TimeSlotState;

  /** Refresh function to call after debounce */
  onRefresh: () => Promise<void>;

  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;

  /** Whether state has been initialized (skip debounce for initial load) */
  isInitialized: boolean;
}

interface UseDebounceRefreshReturn {
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;

  /** Cancel any pending debounced refresh */
  cancelPending: () => void;

  /** Force an immediate refresh (bypass debounce) */
  refreshNow: () => void;
}
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PoolDetail (Page)                            │
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  useTimeSlotState   │───►│           TimeSlotState             │ │
│  │  (Source of Truth)  │    │  { date, startTime, endTime,        │ │
│  └─────────────────────┘    │    duration, slotIndex }            │ │
│           │                 └─────────────────────────────────────┘ │
│           │                           │                             │
│           ▼                           ▼                             │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ useDebounceRefresh  │    │       UI Components (Controlled)     │ │
│  │ (Watches changes)   │    │                                     │ │
│  └─────────────────────┘    │  ┌─────────────┐  ┌──────────────┐  │ │
│           │                 │  │TimeSlotPicker│  │SlotNavigation│  │ │
│           │                 │  │  (Manual)    │  │  Buttons     │  │ │
│           ▼                 │  └─────────────┘  └──────────────┘  │ │
│  ┌─────────────────────┐    │         ▲              ▲            │ │
│  │   fetchAvailability │    │         │              │            │ │
│  │   (API Call)        │    │         └──────┬───────┘            │ │
│  └─────────────────────┘    │                │                    │ │
│           │                 │     ┌──────────┴──────────┐         │ │
│           ▼                 │     │  useSlotNavigation  │         │ │
│  ┌─────────────────────┐    │     │  (Stateless Actions)│         │ │
│  │   AvailabilityState │    │     └─────────────────────┘         │ │
│  │   (Display in UI)   │    └─────────────────────────────────────┘ │
│  └─────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Derived Values

These values are computed from TimeSlotState, not stored separately:

| Derived Value | Computation | Used By |
|---------------|-------------|---------|
| `slotIndex` | `getSlotIndex(startTime)` | useSlotNavigation |
| `duration` | `(endTime - startTime)` in minutes | Display, preferences |
| `canNavigatePrevious` | `slotIndex > 0` | SlotNavigationButtons |
| `canNavigateNext` | `slotIndex < 34` | SlotNavigationButtons |
| `canExtend` | `endTime + 30 <= maxEndTime` | SlotNavigationButtons |
| `canReduce` | `duration > 30` | SlotNavigationButtons |
| `formattedDuration` | `${hours}h ${mins}min` | TimeSlotPicker display |
