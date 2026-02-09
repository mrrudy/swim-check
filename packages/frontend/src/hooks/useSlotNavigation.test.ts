import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlotNavigation } from './useSlotNavigation';

describe('useSlotNavigation', () => {
  // Helper to create default controlled props
  const createDefaultProps = (overrides = {}) => ({
    startTime: '10:00',
    duration: 60,
    onNavigate: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // User Story 1: Navigate Between Slots
  // ==========================================

  describe('US1: navigation', () => {
    it('should call onNavigate jumping by duration on navigateNext (60min duration → +2 slots)', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => result.current.navigateNext());

      // duration=60, forwardSlotCount=1 → step=2 indices → 10:00 + 60min = 11:00
      expect(onNavigate).toHaveBeenCalledWith('11:00', '12:00', 60);
    });

    it('should call onNavigate jumping by duration on navigatePrevious (60min duration → -2 slots)', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => result.current.navigatePrevious());

      // duration=60, forwardSlotCount=1 → step=2 indices → 10:00 - 60min = 09:00
      expect(onNavigate).toHaveBeenCalledWith('09:00', '10:00', 60);
    });

    it('should not allow navigating past last slot (22:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '22:00',
            duration: 30,
          })
        )
      );

      expect(result.current.canNavigateNext).toBe(false);
    });

    it('should not allow navigating before first slot (05:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '05:00',
          })
        )
      );

      // duration=60 → step=2 indices. 05:00 (index 0) - 2 = -2 < 0
      expect(result.current.canNavigatePrevious).toBe(false);
    });

    it('should respond to ArrowRight key', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowRight',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onNavigate).toHaveBeenCalledWith('11:00', '12:00', 60);
    });

    it('should respond to ArrowLeft key', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowLeft',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onNavigate).toHaveBeenCalledWith('09:00', '10:00', 60);
    });

    it('should compute endTime based on startTime and duration', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '10:00',
            duration: 90,
          })
        )
      );

      expect(result.current.endTime).toBe('11:30');
    });

    it('should compute currentSlotIndex from startTime', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '10:00',
          })
        )
      );

      // 10:00 is index 10 (5 hours from 05:00, at 30-min intervals = 10 slots)
      expect(result.current.currentSlotIndex).toBe(10);
    });
  });

  // ==========================================
  // User Story 2: Extend Duration
  // ==========================================

  describe('US2: extend duration', () => {
    it('should call onNavigate with extended duration', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => result.current.extendDuration());

      expect(onNavigate).toHaveBeenCalledWith('10:00', '11:30', 90);
    });

    it('should not allow extending past pool closing (22:00)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '21:30',
            duration: 30,
          })
        )
      );

      expect(result.current.canExtend).toBe(false);
    });

    it('should respond to ArrowDown key for extend', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onNavigate).toHaveBeenCalledWith('10:00', '11:30', 90);
    });
  });

  // ==========================================
  // User Story 3: Reduce Duration
  // ==========================================

  describe('US3: reduce duration', () => {
    it('should call onNavigate with reduced duration', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => result.current.reduceDuration());

      expect(onNavigate).toHaveBeenCalledWith('10:00', '10:30', 30);
    });

    it('should not allow reducing below minimum duration (30)', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            duration: 30,
          })
        )
      );

      expect(result.current.canReduce).toBe(false);
    });

    it('should respond to ArrowUp key for reduce', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onNavigate).toHaveBeenCalledWith('10:00', '10:30', 30);
    });
  });

  // ==========================================
  // Edge cases and controlled state
  // ==========================================

  describe('edge cases', () => {
    it('should handle boundary navigation at end of day', () => {
      // duration=30 → step=1 index. 21:30 is index 33, 33+1=34 = LAST_SLOT_INDEX → allowed
      const { result: result1 } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '21:30',
            duration: 30,
          })
        )
      );

      expect(result1.current.canNavigateNext).toBe(true);

      // At 22:00 (index 34), 34+1=35 > LAST_SLOT_INDEX → cannot navigate further
      const { result: result2 } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '22:00',
            duration: 30,
          })
        )
      );

      expect(result2.current.canNavigateNext).toBe(false);
    });

    it('should clamp endTime to 22:00 when computing', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '21:00',
            duration: 90, // Would extend past 22:00
          })
        )
      );

      expect(result.current.endTime).toBe('22:00');
    });

    it('should not call onNavigate for unhandled keys', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ onNavigate }))
      );

      act(() => {
        result.current.handleKeyDown({
          key: 'Enter',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent);
      });

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not call onNavigate when cannot navigate previous', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '05:00',
            onNavigate,
          })
        )
      );

      act(() => result.current.navigatePrevious());

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not call onNavigate when cannot navigate next', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '22:00',
            duration: 30,
            onNavigate,
          })
        )
      );

      act(() => result.current.navigateNext());

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not call onNavigate when cannot extend', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            startTime: '21:30',
            duration: 30,
            onNavigate,
          })
        )
      );

      act(() => result.current.extendDuration());

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('should not call onNavigate when cannot reduce', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(
          createDefaultProps({
            duration: 30,
            onNavigate,
          })
        )
      );

      act(() => result.current.reduceDuration());

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Forward slot count navigation
  // ==========================================

  describe('forwardSlotCount navigation', () => {
    it('should jump by duration * forwardSlotCount on navigateNext', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({
          startTime: '08:30',
          duration: 60,
          forwardSlotCount: 3,
          onNavigate,
        }))
      );

      act(() => result.current.navigateNext());

      // step = (60/30) * 3 = 6 indices = 3 hours → 08:30 + 3h = 11:30
      expect(onNavigate).toHaveBeenCalledWith('11:30', '12:30', 60);
    });

    it('should jump by duration * forwardSlotCount on navigatePrevious', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({
          startTime: '11:30',
          duration: 60,
          forwardSlotCount: 3,
          onNavigate,
        }))
      );

      act(() => result.current.navigatePrevious());

      // step = 6 indices → 11:30 - 3h = 08:30
      expect(onNavigate).toHaveBeenCalledWith('08:30', '09:30', 60);
    });

    it('should disable navigation when step would exceed boundaries', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({
          startTime: '08:00',
          duration: 60,
          forwardSlotCount: 3,
        }))
      );

      // step = 6 indices. 08:00 is index 6. 6 - 6 = 0 = FIRST_SLOT_INDEX → allowed
      expect(result.current.canNavigatePrevious).toBe(true);

      // Now at 07:30 (index 5), step 6 → 5 - 6 = -1 < 0 → not allowed
      const { result: result2 } = renderHook(() =>
        useSlotNavigation(createDefaultProps({
          startTime: '07:30',
          duration: 60,
          forwardSlotCount: 3,
        }))
      );

      expect(result2.current.canNavigatePrevious).toBe(false);
    });

    it('should work with 30min duration and forwardSlotCount=1 (single slot jump)', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({
          startTime: '10:00',
          duration: 30,
          forwardSlotCount: 1,
          onNavigate,
        }))
      );

      act(() => result.current.navigateNext());

      // step = (30/30) * 1 = 1 index = 30min → 10:00 + 30min = 10:30
      expect(onNavigate).toHaveBeenCalledWith('10:30', '11:00', 30);
    });
  });

  // ==========================================
  // Controlled state pass-through
  // ==========================================

  describe('controlled state', () => {
    it('should return startTime from props', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ startTime: '15:00' }))
      );

      expect(result.current.startTime).toBe('15:00');
    });

    it('should return duration from props', () => {
      const { result } = renderHook(() =>
        useSlotNavigation(createDefaultProps({ duration: 120 }))
      );

      expect(result.current.duration).toBe(120);
    });

    it('should update when props change', () => {
      const { result, rerender } = renderHook(
        (props) => useSlotNavigation(props),
        { initialProps: createDefaultProps({ startTime: '10:00' }) }
      );

      expect(result.current.startTime).toBe('10:00');
      expect(result.current.currentSlotIndex).toBe(10);

      rerender(createDefaultProps({ startTime: '12:00' }));

      expect(result.current.startTime).toBe('12:00');
      expect(result.current.currentSlotIndex).toBe(14);
    });
  });
});
