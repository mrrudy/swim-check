import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlotNavigation } from './useSlotNavigation';

describe('useSlotNavigation', () => {
  const defaultProps = {
    initialStartTime: '10:00',
    initialDuration: 60,
    onSlotChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // User Story 1: Navigate Between Slots (T007-T011)
  // ==========================================

  describe('US1: navigation', () => {
    // T007: navigateNext moves to next slot
    it('should move to next slot on navigateNext', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => result.current.navigateNext());

      expect(result.current.startTime).toBe('10:30');
    });

    // T008: navigatePrevious moves to previous slot
    it('should move to previous slot on navigatePrevious', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => result.current.navigatePrevious());

      expect(result.current.startTime).toBe('09:30');
    });

    // T009: canNavigateNext is false at last slot (22:00)
    it('should not allow navigating past last slot (22:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '22:00',
          initialDuration: 30, // Minimum duration at end
        })
      );

      expect(result.current.canNavigateNext).toBe(false);
    });

    // T010: canNavigatePrevious is false at first slot (05:00)
    it('should not allow navigating before first slot (05:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '05:00',
        })
      );

      expect(result.current.canNavigatePrevious).toBe(false);
    });

    // T011: handleKeyDown responds to ArrowLeft/ArrowRight
    it('should respond to ArrowRight key', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.startTime).toBe('10:30');
    });

    it('should respond to ArrowLeft key', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.startTime).toBe('09:30');
    });

    it('should call onSlotChange when navigating', () => {
      const onSlotChange = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation({ ...defaultProps, onSlotChange })
      );

      act(() => result.current.navigateNext());

      expect(onSlotChange).toHaveBeenCalledWith('10:30', '11:30', 60);
    });

    it('should recalculate endTime based on duration when navigating', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '10:00',
          initialDuration: 90,
        })
      );

      expect(result.current.endTime).toBe('11:30');

      act(() => result.current.navigateNext());

      expect(result.current.startTime).toBe('10:30');
      expect(result.current.endTime).toBe('12:00');
    });
  });

  // ==========================================
  // User Story 2: Extend Duration (T025-T028)
  // ==========================================

  describe('US2: extend duration', () => {
    // T025: extendDuration increases duration by 30 minutes
    it('should extend duration by 30 minutes', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => result.current.extendDuration());

      expect(result.current.duration).toBe(90);
    });

    // T026: extendDuration updates endTime correctly
    it('should update endTime correctly when extending', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      expect(result.current.endTime).toBe('11:00');

      act(() => result.current.extendDuration());

      expect(result.current.endTime).toBe('11:30');
    });

    // T027: canExtend is false when endTime would exceed 22:00
    it('should not allow extending past pool closing (22:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '21:30',
          initialDuration: 30,
        })
      );

      expect(result.current.canExtend).toBe(false);
    });

    // T028: handleKeyDown responds to ArrowDown for extend
    it('should respond to ArrowDown key for extend', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.duration).toBe(90);
    });
  });

  // ==========================================
  // User Story 3: Reduce Duration (T038-T041)
  // ==========================================

  describe('US3: reduce duration', () => {
    // T038: reduceDuration decreases duration by 30 minutes
    it('should reduce duration by 30 minutes', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => result.current.reduceDuration());

      expect(result.current.duration).toBe(30);
    });

    // T039: reduceDuration updates endTime correctly
    it('should update endTime correctly when reducing', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      expect(result.current.endTime).toBe('11:00');

      act(() => result.current.reduceDuration());

      expect(result.current.endTime).toBe('10:30');
    });

    // T040: canReduce is false when duration is 30 (minimum)
    it('should not allow reducing below minimum duration (30)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialDuration: 30,
        })
      );

      expect(result.current.canReduce).toBe(false);
    });

    // T041: handleKeyDown responds to ArrowUp for reduce
    it('should respond to ArrowUp key for reduce', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.duration).toBe(30);
    });
  });

  // ==========================================
  // Edge cases and integration
  // ==========================================

  describe('edge cases', () => {
    it('should handle boundary navigation at end of day', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '21:30',
          initialDuration: 30,
        })
      );

      // Cannot navigate next at 21:30 with 30min duration (would go to 22:00 start)
      expect(result.current.canNavigateNext).toBe(true);

      act(() => result.current.navigateNext());

      // Now at 22:00, cannot navigate further
      expect(result.current.startTime).toBe('22:00');
      expect(result.current.canNavigateNext).toBe(false);
    });

    it('should clamp endTime to 22:00 when extending near closing', () => {
      const { result } = renderHook(() =>
        useSlotNavigation({
          ...defaultProps,
          initialStartTime: '21:00',
          initialDuration: 30,
        })
      );

      act(() => result.current.extendDuration());

      expect(result.current.endTime).toBe('22:00');
    });

    it('should not modify state for unhandled keys', () => {
      const { result } = renderHook(() => useSlotNavigation(defaultProps));

      const initialState = {
        startTime: result.current.startTime,
        duration: result.current.duration,
      };

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(result.current.startTime).toBe(initialState.startTime);
      expect(result.current.duration).toBe(initialState.duration);
    });
  });
});
