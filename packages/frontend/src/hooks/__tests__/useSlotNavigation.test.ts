/**
 * Unit tests for cross-day navigation boundary behavior (011-smart-slot-selection)
 * T011: Test cases for useSlotNavigation cross-day boundaries
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlotNavigation } from '../useSlotNavigation';

describe('useSlotNavigation - cross-day navigation', () => {
  describe('canNavigateNext at last slot', () => {
    it('should return true at last slot when cross-day is enabled', () => {
      const onNavigate = vi.fn();
      const onDateChange = vi.fn();
      // At 22:00 (index 34) with 30min duration (step 1): 34+1=35 > 34 → can't go within day
      // But cross-day is enabled → canNavigateNext = true
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '22:00',
          duration: 30,
          onNavigate,
          date: '2026-02-11',
          onDateChange,
        })
      );

      expect(result.current.canNavigateNext).toBe(true);
    });

    it('should call onDateChange with next day when navigating next at last slot', () => {
      const onNavigate = vi.fn();
      const onDateChange = vi.fn();
      // At 22:00 (last slot), can't navigate within day → triggers cross-day
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '22:00',
          duration: 30,
          onNavigate,
          date: '2026-02-11',
          onDateChange,
        })
      );

      act(() => {
        result.current.navigateNext();
      });

      expect(onDateChange).toHaveBeenCalledWith('2026-02-12');
      expect(onNavigate).toHaveBeenCalledWith('05:00', expect.any(String), 30);
    });
  });

  describe('canNavigatePrevious at first slot', () => {
    it('should return true at first slot when cross-day is enabled', () => {
      const onNavigate = vi.fn();
      const onDateChange = vi.fn();
      // At 05:00 (index 0) with 60min duration (step 2): 0-2=-2 < 0 → can't go within day
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '05:00',
          duration: 60,
          onNavigate,
          date: '2026-02-11',
          onDateChange,
        })
      );

      expect(result.current.canNavigatePrevious).toBe(true);
    });

    it('should call onDateChange with previous day when navigating previous at first slot', () => {
      const onNavigate = vi.fn();
      const onDateChange = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '05:00',
          duration: 60,
          onNavigate,
          date: '2026-02-11',
          onDateChange,
        })
      );

      act(() => {
        result.current.navigatePrevious();
      });

      expect(onDateChange).toHaveBeenCalledWith('2026-02-10');
      // Last available start time for 60min: 21:00
      expect(onNavigate).toHaveBeenCalledWith('21:00', '22:00', 60);
    });
  });

  describe('mid-day navigation unchanged', () => {
    it('should not call onDateChange for mid-day navigation', () => {
      const onNavigate = vi.fn();
      const onDateChange = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '14:00',
          duration: 60,
          onNavigate,
          date: '2026-02-11',
          onDateChange,
        })
      );

      act(() => {
        result.current.navigateNext();
      });

      expect(onDateChange).not.toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalled();
    });
  });

  describe('backward compatibility without date props', () => {
    it('should disable cross-day navigation without date and onDateChange', () => {
      const onNavigate = vi.fn();
      // At 22:00 (last slot) without cross-day → canNavigateNext = false
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '22:00',
          duration: 30,
          onNavigate,
        })
      );

      expect(result.current.canNavigateNext).toBe(false);
    });

    it('should still allow within-day navigation without date props', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useSlotNavigation({
          startTime: '14:00',
          duration: 60,
          onNavigate,
        })
      );

      expect(result.current.canNavigateNext).toBe(true);
      expect(result.current.canNavigatePrevious).toBe(true);
    });
  });
});
