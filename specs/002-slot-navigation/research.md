# Research: Pool Availability Slot Navigation

**Feature**: 002-slot-navigation
**Date**: 2026-02-01

## Research Tasks

### 1. React Keyboard Event Handling Patterns

**Context**: Need to implement arrow key navigation for time slot selection.

**Decision**: Use native React keyboard event handlers with `onKeyDown` on a focusable container.

**Rationale**:
- React's synthetic event system provides consistent cross-browser behavior
- No external dependencies needed (aligns with Simplicity principle)
- Well-documented pattern with predictable behavior

**Alternatives Considered**:
- **useHotkeys library**: More features but adds dependency; overkill for 4 arrow keys
- **Global window.addEventListener**: Harder to manage focus, potential conflicts with other components
- **react-hotkeys-hook**: Popular but unnecessary abstraction for simple arrow navigation

**Implementation Pattern**:
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowLeft') navigatePrevious();
  if (e.key === 'ArrowRight') navigateNext();
  if (e.key === 'ArrowUp') reduceDuration();
  if (e.key === 'ArrowDown') extendDuration();
};

// Container must have tabIndex={0} to receive focus
<div tabIndex={0} onKeyDown={handleKeyDown} />
```

---

### 2. Time Slot Navigation Logic

**Context**: Need to navigate between 30-minute slots from 05:00 to 22:00.

**Decision**: Reuse existing `TIME_OPTIONS` array from TimeSlotPicker as the slot index source.

**Rationale**:
- TIME_OPTIONS already generates all valid slots at 30-minute intervals
- Consistent with existing component behavior
- Simple index-based navigation (increment/decrement)

**Slot Index Calculations**:
- Total slots: 35 (05:00 to 22:00 in 30-min increments)
- First slot index: 0 (05:00)
- Last slot index: 34 (22:00)
- Navigation: `newIndex = Math.max(0, Math.min(34, currentIndex + direction))`

**Boundary Behavior**:
- At first slot (05:00): Left arrow does nothing, visual feedback shown
- At last slot (22:00): Right arrow does nothing, visual feedback shown

---

### 3. Duration Adjustment Logic

**Context**: Need to extend/reduce slot duration by 30 minutes using up/down arrows.

**Decision**: Adjust `endTime` while keeping `startTime` fixed; clamp to valid range.

**Rationale**:
- Matches existing TimeSlotPicker behavior where user picks start, duration auto-calculates end
- Simpler mental model: "I'm at this start time, how long do I want to swim?"
- Reuses existing `calculateEndTime` function from time-slot service

**Duration Constraints**:
- Minimum: 30 minutes (spec requirement, industry standard)
- Maximum: Dynamic - either pool closing time (22:00) or next booking conflict
- Increment: 30 minutes (matches slot resolution)

**Calculation**:
```typescript
const extendDuration = () => {
  const newDuration = currentDuration + 30;
  const newEndTime = calculateEndTime(startTime, newDuration);
  if (newEndTime <= '22:00' && !hasConflict(startTime, newEndTime)) {
    setDuration(newDuration);
  }
};

const reduceDuration = () => {
  const newDuration = currentDuration - 30;
  if (newDuration >= 30) {
    setDuration(newDuration);
  }
};
```

---

### 4. Focus Management for Keyboard Navigation

**Context**: Keyboard navigation should only work when availability view has focus.

**Decision**: Add `tabIndex={0}` to PoolDetail container and track focus state with `onFocus`/`onBlur`.

**Rationale**:
- Standard web accessibility pattern
- Prevents conflicts with other focusable elements (date picker, time selects)
- Clear visual indicator when navigation is active

**Focus Flow**:
1. User clicks anywhere in availability section → container receives focus
2. Arrow keys now control slot navigation
3. User tabs to form fields → container loses focus
4. Arrow keys revert to normal browser behavior

**Visual Feedback**:
- Focused state: subtle outline or highlight on navigation area
- Consider CSS `:focus-visible` for keyboard-only focus indication

---

### 5. Custom Hook Design: useSlotNavigation

**Context**: Encapsulate navigation state and logic for testability and reuse.

**Decision**: Create `useSlotNavigation` hook returning state and handlers.

**Rationale**:
- Testable in isolation (constitution: Test-First Development)
- Reusable if navigation needed elsewhere
- Clean separation from presentation (constitution: Readable Code)

**Hook Interface**:
```typescript
interface UseSlotNavigationProps {
  availableSlots: string[]; // TIME_OPTIONS filtered by availability
  initialStartTime: string;
  initialDuration: number;
  maxEndTime: string; // Pool closing or next booking
  onSlotChange: (startTime: string, endTime: string) => void;
}

interface UseSlotNavigationReturn {
  currentSlotIndex: number;
  startTime: string;
  endTime: string;
  duration: number;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;
  navigatePrevious: () => void;
  navigateNext: () => void;
  extendDuration: () => void;
  reduceDuration: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}
```

---

### 6. UI Button Component Design

**Context**: Need Previous/Next and Extend/Reduce buttons with keyboard hint display.

**Decision**: Create `SlotNavigationButtons` component with grouped button layout.

**Rationale**:
- Keeps button logic separate from keyboard handling
- Allows styling controls independently
- Follows existing component patterns in codebase

**Button Layout**:
```
[◀ Previous] [Start: HH:MM] [Next ▶]    ← Slot navigation
[▲ Reduce]  [Duration: Xh Ymin] [▼ Extend]  ← Duration control
           [Keyboard hints: ←→ navigate, ↑↓ duration]
```

**Accessibility**:
- Buttons have `aria-label` with clear descriptions
- Disabled state when at boundary
- Focus management doesn't interfere with button clicks

---

### 7. Integration with Existing Components

**Context**: Need to integrate navigation with TimeSlotPicker and PoolDetail.

**Decision**: Add navigation controls alongside (not replacing) TimeSlotPicker; let PoolDetail coordinate state.

**Rationale**:
- TimeSlotPicker dropdown stays for date/time selection
- Navigation provides quick adjustment once initial selection made
- PoolDetail already manages time params state

**Integration Points**:
1. `TimeSlotPicker`: No changes needed, continue using for initial selection
2. `PoolDetail`: Add `useSlotNavigation` hook, render `SlotNavigationButtons`
3. State sync: Navigation changes update `timeParams`, triggering availability fetch

**Data Flow**:
```
User keyboard/button → useSlotNavigation → PoolDetail.setTimeParams → fetchAvailability
                                        ↓
                       TimeSlotPicker receives new initial values (optional sync)
```

---

### 8. Existing Slot Data Compatibility

**Context**: TimeSlotPicker has 35 time options; need to understand slot structure.

**Decision**: Navigation operates on full slot list; availability view shows current selection.

**Rationale**:
- TIME_OPTIONS array provides complete slot list (05:00-22:00)
- Current selection is just start+duration within this range
- No backend changes needed for slot list

**Existing Constants**:
```typescript
// From TimeSlotPicker.tsx
const TIME_OPTIONS = generateTimeOptions(); // 35 slots: 05:00 to 22:00

// Pool operating hours
const POOL_OPEN = '05:00';
const POOL_CLOSE = '22:00';

// Duration constraints
const MIN_DURATION = 30; // minutes
const MAX_DURATION = 480; // 8 hours (full day coverage)
const DURATION_STEP = 30; // minutes
```

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Keyboard handling | Native React `onKeyDown` | No dependencies, sufficient for arrow keys |
| Slot navigation | Index-based on TIME_OPTIONS | Reuses existing logic, simple math |
| Duration adjustment | Adjust endTime, fix startTime | Matches existing UX pattern |
| Focus management | `tabIndex={0}` + focus tracking | Standard a11y, prevents conflicts |
| State management | Custom `useSlotNavigation` hook | Testable, encapsulated, reusable |
| UI buttons | Separate `SlotNavigationButtons` | Separation of concerns |
| Integration | Coordinate in PoolDetail | Minimal changes to existing components |

## Dependencies Identified

- No new npm packages required
- Vitest for testing (already in project)
- Existing TIME_OPTIONS and time calculation utilities

## Files to Create/Modify

**New Files**:
- `packages/frontend/src/hooks/useSlotNavigation.ts`
- `packages/frontend/src/hooks/useSlotNavigation.test.ts`
- `packages/frontend/src/components/SlotNavigationButtons.tsx`
- `packages/frontend/src/components/SlotNavigationButtons.test.tsx`
- `packages/frontend/src/components/KeyboardHints.tsx`

**Modified Files**:
- `packages/frontend/src/pages/PoolDetail.tsx` - Add navigation integration
- `packages/shared/src/types/models.ts` - Add SlotNavigationState type (optional)
