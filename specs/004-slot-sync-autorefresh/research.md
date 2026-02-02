# Research: Time Slot Selection Synchronization with Auto-Refresh

**Date**: 2026-02-02
**Feature**: 004-slot-sync-autorefresh

## Research Questions

### 1. Current State Management Architecture

**Question**: How do TimeSlotPicker and SlotNavigationButtons currently manage state?

**Findings**:

| Component | State Management | State Location |
|-----------|-----------------|----------------|
| `TimeSlotPicker` | Internal `useState` for date, startTime, endTime | Component-local |
| `useSlotNavigation` | Internal `useState` for slotIndex, duration | Hook-local |
| `PoolDetail` | `timeParams` state receives updates from both | Page-level |

**Current Flow Problem**:
1. `TimeSlotPicker` manages its own state and calls `onChange` to notify parent
2. `useSlotNavigation` manages its own state and calls `onSlotChange` to notify parent
3. Neither component receives state FROM the other
4. `PoolDetail` receives changes but doesn't push state back (unidirectional only)

**Decision**: Implement "lifting state up" pattern - create unified state hook that both components consume as controlled inputs.

**Rationale**: This is the standard React pattern for synchronizing sibling components. It avoids prop drilling while maintaining unidirectional data flow.

**Alternatives Considered**:
- React Context: Overkill for single-page scope, adds unnecessary complexity
- Redux/Zustand: External state library not needed for local component coordination
- Event bus: Anti-pattern in React, breaks unidirectional flow

---

### 2. React Debounce Patterns for Auto-Refresh

**Question**: What is the best pattern for implementing a 2-second debounce auto-refresh in React?

**Findings**:

| Pattern | Pros | Cons |
|---------|------|------|
| `useEffect` + `setTimeout` | Simple, no dependencies | Manual cleanup needed |
| Custom `useDebounce` hook | Reusable, clean API | Another abstraction |
| `lodash.debounce` | Battle-tested | External dependency |
| `useDeferredValue` (React 18) | Built-in | Different semantics (priority, not delay) |

**Decision**: Custom `useDebounce` hook with `setTimeout`/`clearTimeout` using cleanup function in `useEffect`.

**Rationale**:
- No external dependencies (follows constitution's simplicity principle)
- Encapsulates timer lifecycle management
- Matches existing hook patterns in codebase
- Easy to test timer behavior with `vi.useFakeTimers()`

**Implementation Pattern**:
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**Alternatives Considered**:
- `lodash.debounce`: Would add external dependency, against simplicity principle
- React 18's `useDeferredValue`: Designed for priority scheduling, not timed delays

---

### 3. Controlled Component Pattern for TimeSlotPicker

**Question**: How should `TimeSlotPicker` be modified to support both controlled and uncontrolled modes?

**Findings**:

Current `TimeSlotPicker` signature:
```typescript
interface TimeSlotPickerProps {
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onChange: (date: string, startTime: string, endTime: string) => void;
}
```

Required controlled signature:
```typescript
interface TimeSlotPickerProps {
  // Controlled mode (new)
  date?: string;
  startTime?: string;
  endTime?: string;
  // Event handlers
  onDateChange?: (date: string) => void;
  onStartTimeChange?: (startTime: string) => void;
  onEndTimeChange?: (endTime: string) => void;
  // Legacy support (optional)
  onChange?: (date: string, startTime: string, endTime: string) => void;
}
```

**Decision**: Convert `TimeSlotPicker` to fully controlled component, removing internal state.

**Rationale**:
- Controlled components are the standard React pattern for form inputs
- Enables parent to be single source of truth
- Eliminates synchronization bugs from dual state
- Matches how `SlotNavigationButtons` already works (pure props)

**Alternatives Considered**:
- Hybrid controlled/uncontrolled: More complex, error-prone, violates simplicity
- Keep uncontrolled with imperative ref: Anti-pattern in modern React

---

### 4. useSlotNavigation Refactoring

**Question**: How should `useSlotNavigation` be modified to work with shared state?

**Findings**:

Current hook manages internal state:
```typescript
const [currentSlotIndex, setCurrentSlotIndex] = useState(() => getSlotIndex(initialStartTime));
const [duration, setDuration] = useState(initialDuration);
```

**Problem**: Hook doesn't re-sync when `initialStartTime` or `initialDuration` change externally.

**Decision**: Convert to "reducer-style" pattern where hook receives current state and returns actions only.

**New Pattern**:
```typescript
interface UseSlotNavigationProps {
  startTime: string;       // Current value (controlled)
  duration: number;        // Current value (controlled)
  onNavigate: (startTime: string, duration: number) => void;  // State update callback
}

// Hook no longer owns state, just computes navigation logic
function useSlotNavigation({ startTime, duration, onNavigate }) {
  const slotIndex = useMemo(() => getSlotIndex(startTime), [startTime]);
  // ... navigation functions call onNavigate instead of internal setState
}
```

**Rationale**:
- Hook becomes stateless, easier to test
- Single source of truth in parent component
- Navigation actions go through same state update path as manual input

**Alternatives Considered**:
- Effect-based sync: `useEffect` to sync internal state on prop changes - creates race conditions
- Two-way binding: Both ways own state and sync - complex, bug-prone

---

### 5. Auto-Refresh Trigger Logic

**Question**: When exactly should auto-refresh trigger?

**Findings from spec**:

| Trigger Condition | Behavior |
|-------------------|----------|
| Start time changes | Start 2s timer, cancel previous |
| Duration changes | Start 2s timer, cancel previous |
| Date changes | Start 2s timer, cancel previous |
| Page load with defaults | Trigger refresh immediately (FR-010) |
| Timer completes | Execute single refresh (FR-005) |
| User interaction during timer | Reset timer (FR-006) |

**Decision**: Implement debounced effect that watches `{ date, startTime, endTime }` tuple.

**Implementation Approach**:
```typescript
// In PoolDetail
const debouncedTimeParams = useDebounce(timeParams, 2000);

useEffect(() => {
  if (debouncedTimeParams) {
    fetchAvailability();
  }
}, [debouncedTimeParams]);

// Special case: immediate refresh on initial load
useEffect(() => {
  if (isInitialized && !hasRefreshedOnce) {
    fetchAvailability();
    setHasRefreshedOnce(true);
  }
}, [isInitialized]);
```

**Rationale**:
- Debounced value changes only after 2s of stability
- Separating initial load ensures FR-010 compliance
- Clean separation between "what changed" and "when to refresh"

---

### 6. Concurrent Refresh Handling

**Question**: How should overlapping refresh requests be handled?

**Findings from spec (FR-009)**:
> System MUST handle concurrent refresh requests gracefully, preventing duplicate or conflicting requests.

**Options**:
1. **Ignore new requests while loading**: Simple but may show stale data
2. **Cancel previous request, start new**: AbortController pattern
3. **Queue requests**: Complex, unnecessary for this use case

**Decision**: Use AbortController to cancel in-flight requests when new refresh triggers.

**Implementation Pattern**:
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const fetchAvailability = useCallback(async () => {
  // Cancel any in-flight request
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  try {
    const result = await api.getPoolAvailability(
      poolId, date, startTime, endTime,
      { signal: abortControllerRef.current.signal }
    );
    // ... handle result
  } catch (err) {
    if (err.name !== 'AbortError') {
      setError(err.message);
    }
  }
}, [poolId, date, startTime, endTime]);
```

**Rationale**:
- Standard web API for request cancellation
- Ensures UI always shows result for most recent selection
- No wasted network resources on abandoned requests

**Alternatives Considered**:
- Ignoring: Could show wrong data for final selection
- Queuing: Over-engineered for this scenario

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| State architecture | Lift state to unified hook, both components become controlled |
| Debounce pattern | Custom `useDebounce` hook with setTimeout |
| TimeSlotPicker | Convert to fully controlled component |
| useSlotNavigation | Convert to stateless action provider |
| Auto-refresh trigger | Debounced effect watching time params tuple |
| Concurrent requests | AbortController cancellation pattern |

## Dependencies Identified

- No new external dependencies required
- Uses standard React APIs and existing codebase patterns
- API client may need `signal` parameter support (check api.ts)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Refactor tests to use controlled component pattern |
| API doesn't support AbortController | Add signal support to api.ts or fall back to ignore pattern |
| Timer precision on different browsers | ±100ms tolerance in SC-003 accounts for browser variance |
