# Quickstart: Time Slot Selection Synchronization with Auto-Refresh

**Date**: 2026-02-02
**Feature**: 004-slot-sync-autorefresh

## Prerequisites

- Node.js 20 LTS
- npm or yarn
- Running backend API (port 3000)

## Development Setup

```bash
# Navigate to frontend package
cd packages/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/hooks/useTimeSlotState.test.ts
```

## Key Files to Understand

### State Management

| File | Purpose |
|------|---------|
| `src/hooks/useTimeSlotState.ts` | **NEW** - Unified state hook (source of truth) |
| `src/hooks/useDebounceRefresh.ts` | **NEW** - Debounced auto-refresh logic |
| `src/hooks/useSlotNavigation.ts` | **MODIFIED** - Stateless navigation actions |

### Components

| File | Purpose |
|------|---------|
| `src/components/TimeSlotPicker.tsx` | **MODIFIED** - Controlled component |
| `src/components/SlotNavigationButtons.tsx` | No changes (already controlled) |
| `src/pages/PoolDetail.tsx` | **MODIFIED** - Integration point |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/timeSlotUtils.ts` | Existing time calculation utilities |

## Architecture Overview

```
PoolDetail.tsx
    │
    ├── useTimeSlotState()      ←── Single source of truth
    │       │
    │       ├── state: { date, startTime, endTime, duration }
    │       └── setters: setDate, setStartTime, setEndTime
    │
    ├── useDebounceRefresh()    ←── Watches state, triggers refresh
    │       │
    │       └── triggers fetchAvailability() after 2s idle
    │
    ├── TimeSlotPicker          ←── Controlled by state
    │       │
    │       └── onChange → setDate/setStartTime/setEndTime
    │
    └── useSlotNavigation()     ←── Reads state, provides actions
            │
            └── navigatePrevious/Next → handleNavigation → updates state
```

## Test-First Development

Per the project constitution, follow Red-Green-Refactor:

### 1. Write failing tests first

```typescript
// Example: useTimeSlotState.test.ts
describe('useTimeSlotState', () => {
  it('syncs start time changes to derived values', () => {
    const { result } = renderHook(() => useTimeSlotState());

    act(() => {
      result.current.setStartTime('10:00');
    });

    expect(result.current.state.startTime).toBe('10:00');
    expect(result.current.state.slotIndex).toBe(10); // 10:00 = index 10
  });
});
```

### 2. Run tests - verify failure

```bash
npm test -- src/hooks/useTimeSlotState.test.ts
# Should FAIL (function doesn't exist yet)
```

### 3. Implement minimal code

```typescript
// src/hooks/useTimeSlotState.ts
export function useTimeSlotState() {
  // Implementation...
}
```

### 4. Run tests - verify pass

```bash
npm test -- src/hooks/useTimeSlotState.test.ts
# Should PASS
```

## Debugging Tips

### Check if components are synchronized

1. Open browser DevTools
2. Add React DevTools extension
3. Select `PoolDetail` component
4. Watch `state` in hooks panel
5. Interact with both TimeSlotPicker and arrow buttons
6. Verify state updates immediately in both places

### Check debounce timing

```typescript
// Add temporary logging in useDebounceRefresh
useEffect(() => {
  console.log('Timer started:', Date.now());
  const timer = setTimeout(() => {
    console.log('Timer fired:', Date.now());
    onRefresh();
  }, delay);
  return () => {
    console.log('Timer cleared:', Date.now());
    clearTimeout(timer);
  };
}, [timeSlotState]);
```

### Test rapid changes

1. Open pool detail page
2. Rapidly click arrow navigation (10+ times quickly)
3. Stop and wait
4. Verify single refresh occurs 2s after last click
5. Check Network tab - should show only one API call after stopping

## Acceptance Criteria Verification

| Criteria | How to Verify |
|----------|---------------|
| SC-001: Manual→Arrow sync <100ms | Change time in picker, arrows update instantly (visual) |
| SC-002: Arrow→Manual sync <100ms | Click arrows, picker updates instantly (visual) |
| SC-003: 2s debounce ±100ms | Use console timing logs, verify ~2000ms delay |
| SC-004: Consistent state 100% | Both UIs always show same values |
| SC-005: Single refresh after rapid | Network tab shows 1 call after 10 quick clicks |
| SC-006: Unified perception | User testing (qualitative) |

## Common Issues

### "State not syncing between components"

**Cause**: Component still using internal state instead of props
**Fix**: Ensure component uses `props.startTime` not `useState(initialStartTime)`

### "Multiple refreshes firing"

**Cause**: Debounce not canceling previous timer
**Fix**: Verify `clearTimeout` in cleanup function

### "Refresh fires immediately on every change"

**Cause**: Debounce dependency array includes functions that change identity
**Fix**: Wrap callbacks in `useCallback` with stable dependencies

### "Tests failing with act() warnings"

**Cause**: State updates outside of act()
**Fix**: Wrap async operations in `await act(async () => { ... })`
