# Quickstart: Pool Availability Slot Navigation

**Feature**: 002-slot-navigation
**Date**: 2026-02-01

## Prerequisites

- Node.js 20 LTS installed
- Project dependencies installed (`npm install` from repo root)
- Development servers running (`npm run dev`)

## Quick Implementation Summary

This feature adds keyboard navigation and buttons to the pool availability view:

| Control | Action |
|---------|--------|
| Left Arrow / `[◀ Prev]` | Jump to previous 30-minute slot |
| Right Arrow / `[Next ▶]` | Jump to next 30-minute slot |
| Up Arrow / `[▲ -30m]` | Reduce duration by 30 minutes |
| Down Arrow / `[+30m ▼]` | Extend duration by 30 minutes |

## Files to Create

### 1. Create hooks directory
```bash
mkdir -p packages/frontend/src/hooks
```

### 2. useSlotNavigation.ts (Test First!)

Create test file first:
```bash
touch packages/frontend/src/hooks/useSlotNavigation.test.ts
```

Test structure:
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlotNavigation } from './useSlotNavigation';

describe('useSlotNavigation', () => {
  describe('navigation', () => {
    it('should move to next slot on navigateNext', () => {
      const { result } = renderHook(() => useSlotNavigation({
        initialStartTime: '10:00',
        initialDuration: 60,
        onSlotChange: vi.fn(),
      }));

      act(() => result.current.navigateNext());

      expect(result.current.startTime).toBe('10:30');
    });

    it('should not navigate past last slot', () => {
      const { result } = renderHook(() => useSlotNavigation({
        initialStartTime: '22:00',
        initialDuration: 30,
        onSlotChange: vi.fn(),
      }));

      expect(result.current.canNavigateNext).toBe(false);
    });
  });

  describe('duration', () => {
    it('should extend duration by 30 minutes', () => {
      const { result } = renderHook(() => useSlotNavigation({
        initialStartTime: '10:00',
        initialDuration: 60,
        onSlotChange: vi.fn(),
      }));

      act(() => result.current.extendDuration());

      expect(result.current.duration).toBe(90);
      expect(result.current.endTime).toBe('11:30');
    });

    it('should not reduce below 30 minutes', () => {
      const { result } = renderHook(() => useSlotNavigation({
        initialStartTime: '10:00',
        initialDuration: 30,
        onSlotChange: vi.fn(),
      }));

      expect(result.current.canReduce).toBe(false);
    });
  });
});
```

### 3. SlotNavigationButtons.tsx

Component structure:
```typescript
interface SlotNavigationButtonsProps {
  startTime: string;
  endTime: string;
  duration: number;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onExtend: () => void;
  onReduce: () => void;
  showKeyboardHints?: boolean;
}

export function SlotNavigationButtons(props: SlotNavigationButtonsProps) {
  // Render navigation and duration controls
}
```

### 4. Integrate in PoolDetail.tsx

```typescript
import { useSlotNavigation } from '../hooks/useSlotNavigation';
import { SlotNavigationButtons } from '../components/SlotNavigationButtons';

export function PoolDetail() {
  // ... existing code ...

  const navigation = useSlotNavigation({
    initialStartTime: timeParams?.startTime || '14:00',
    initialDuration: 60,
    onSlotChange: (startTime, endTime) => {
      setTimeParams(prev => prev ? { ...prev, startTime, endTime } : null);
    },
  });

  return (
    <div
      tabIndex={0}
      onKeyDown={navigation.handleKeyDown}
      style={{ outline: 'none' }} // Or use CSS :focus-visible
    >
      {/* existing TimeSlotPicker */}
      <SlotNavigationButtons
        {...navigation}
        onNavigatePrevious={navigation.navigatePrevious}
        onNavigateNext={navigation.navigateNext}
        onExtend={navigation.extendDuration}
        onReduce={navigation.reduceDuration}
      />
      {/* existing LaneGrid */}
    </div>
  );
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm test -- --watch

# Run specific test file
npm test -- packages/frontend/src/hooks/useSlotNavigation.test.ts
```

## Development Workflow

Following the constitution's Test-First Development:

1. **Write test** for slot navigation boundary case
2. **Run test** - verify it fails (Red)
3. **Implement** minimal code to pass (Green)
4. **Refactor** if needed while tests pass
5. **Repeat** for each requirement

## Key Implementation Notes

### Time Slot Array
Reuse the existing `generateTimeOptions()` from TimeSlotPicker:
```typescript
const TIME_OPTIONS = generateTimeOptions(); // ['05:00', '05:30', ..., '22:00']
```

### Index Calculation
```typescript
const getSlotIndex = (time: string): number => {
  return TIME_OPTIONS.indexOf(time);
};

const getTimeFromIndex = (index: number): string => {
  return TIME_OPTIONS[Math.max(0, Math.min(34, index))];
};
```

### Duration Calculation
Reuse existing `calculateEndTime` logic:
```typescript
const calculateEndTime = (startTime: string, durationMins: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  if (endHours >= 22) return '22:00';

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};
```

## Verification Checklist

- [ ] Tests written and failing before implementation
- [ ] Left/Right arrows navigate between slots
- [ ] Up/Down arrows adjust duration
- [ ] Buttons work same as keyboard
- [ ] Boundaries respected (first slot, last slot, min duration, max duration)
- [ ] Visual feedback on blocked actions
- [ ] Keyboard hints visible
- [ ] Navigation only active when container focused
