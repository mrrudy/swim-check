# API Contracts: Pool Availability Slot Navigation

**Feature**: 002-slot-navigation
**Date**: 2026-02-01

## Overview

This feature requires **no new API endpoints**. It reuses existing endpoints for:
1. Fetching availability data
2. Persisting duration preferences

All navigation logic runs client-side.

## Existing Endpoints (Reused)

### GET /api/v1/pools/:poolId/availability

Fetches lane availability for a specific time slot. Called when navigation changes start/end time.

**Request**:
```
GET /api/v1/pools/:poolId/availability?date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM&refresh=boolean
```

**Response** (200 OK):
```json
{
  "lanes": [
    {
      "laneId": "string",
      "laneNumber": 1,
      "label": "string | null",
      "isAvailable": true,
      "lastUpdated": "2026-02-01T10:30:00Z"
    }
  ],
  "dataFreshness": "fresh | cached | stale | unavailable",
  "scrapedAt": "2026-02-01T10:30:00Z",
  "availableLaneCount": 4,
  "totalLaneCount": 6
}
```

**Usage by Navigation Feature**:
- Called whenever `startTime` or `endTime` changes via navigation
- No changes to request/response format required

---

### PATCH /api/v1/preferences

Updates user's preferred slot duration. Called when duration adjustment changes.

**Request**:
```json
{
  "slotDurationMins": 90
}
```

**Response** (200 OK):
```json
{
  "slotDurationMins": 90,
  "updatedAt": "2026-02-01T10:35:00Z"
}
```

**Usage by Navigation Feature**:
- Called when user extends/reduces duration via up/down arrow or buttons
- Existing behavior preserved (debounced save in TimeSlotPicker)

---

### GET /api/v1/preferences/default-time-slot

Fetches smart default time slot based on current time and saved duration preference.

**Response** (200 OK):
```json
{
  "date": "2026-02-01",
  "startTime": "14:30",
  "endTime": "15:30",
  "durationMins": 60
}
```

**Usage by Navigation Feature**:
- Used to initialize navigation state on component mount
- Provides initial `currentSlotIndex` calculation

---

## Component Contracts

Since this feature is primarily frontend, the key contracts are between components.

### useSlotNavigation Hook Contract

**Input Props**:
```typescript
interface UseSlotNavigationProps {
  /** Initial start time from TimeSlotPicker or API */
  initialStartTime: string;

  /** Initial duration from user preferences */
  initialDuration: number;

  /** Maximum end time (pool closing or booking constraint) */
  maxEndTime?: string; // Default: '22:00'

  /** Callback when slot selection changes */
  onSlotChange: (startTime: string, endTime: string, duration: number) => void;
}
```

**Return Value**:
```typescript
interface UseSlotNavigationReturn {
  // Current state
  currentSlotIndex: number;
  startTime: string;
  endTime: string;
  duration: number;

  // Navigation boundaries
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;

  // Actions
  navigatePrevious: () => void;
  navigateNext: () => void;
  extendDuration: () => void;
  reduceDuration: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}
```

---

### SlotNavigationButtons Component Contract

**Props**:
```typescript
interface SlotNavigationButtonsProps {
  // Current state (display)
  startTime: string;
  endTime: string;
  duration: number;

  // Navigation boundaries
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;

  // Callbacks
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onExtend: () => void;
  onReduce: () => void;

  // Optional
  showKeyboardHints?: boolean; // Default: true
}
```

**Rendered Elements**:
```
┌──────────────────────────────────────────────────────┐
│  [◀ Prev]     Start: {startTime}     [Next ▶]       │
│  [▲ -30m]     Duration: {formatted}  [+30m ▼]       │
│         Tip: ← → navigate, ↑ ↓ duration             │
└──────────────────────────────────────────────────────┘
```

---

### KeyboardHints Component Contract

**Props**:
```typescript
interface KeyboardHintsProps {
  /** Show navigation hints */
  showNavigation?: boolean; // Default: true

  /** Show duration hints */
  showDuration?: boolean; // Default: true

  /** Compact layout */
  compact?: boolean; // Default: false
}
```

**Rendered Output**:
```
Standard: "← → navigate slots  |  ↑ ↓ adjust duration"
Compact:  "←→ ↑↓"
```

---

## Event Contracts

### Keyboard Events

| Event | Key | Action | Precondition |
|-------|-----|--------|--------------|
| Navigate Previous | `ArrowLeft` | `navigatePrevious()` | `canNavigatePrevious === true` |
| Navigate Next | `ArrowRight` | `navigateNext()` | `canNavigateNext === true` |
| Reduce Duration | `ArrowUp` | `reduceDuration()` | `canReduce === true` |
| Extend Duration | `ArrowDown` | `extendDuration()` | `canExtend === true` |

**Event Handling Requirements**:
- Only respond when navigation container has focus
- Call `e.preventDefault()` to prevent scroll on arrow keys
- Provide visual feedback for blocked actions (e.g., shake animation, muted button)

---

## Integration with PoolDetail

```typescript
// In PoolDetail.tsx

const navigation = useSlotNavigation({
  initialStartTime: timeParams?.startTime || '14:00',
  initialDuration: savedDuration || 60,
  onSlotChange: (startTime, endTime, duration) => {
    setTimeParams(prev => ({ ...prev, startTime, endTime }));
    // Duration persistence handled by existing TimeSlotPicker logic
  },
});

return (
  <div
    tabIndex={0}
    onKeyDown={navigation.handleKeyDown}
    onFocus={() => setHasFocus(true)}
    onBlur={() => setHasFocus(false)}
  >
    <TimeSlotPicker onChange={handleTimeChange} />
    <SlotNavigationButtons {...navigation} />
    <LaneGrid lanes={availability.lanes} />
  </div>
);
```

## No Breaking Changes

All contracts are additive:
- Existing API endpoints unchanged
- TimeSlotPicker continues to work independently
- Navigation is an optional enhancement layer
