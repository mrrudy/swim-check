/**
 * useSlotNavigation - Hook for keyboard and button navigation between time slots
 * Stateless controlled hook that receives current state and returns navigation actions
 */

import { useCallback, useMemo } from 'react';
import {
  SLOT_CONSTANTS,
  getSlotIndex,
  getTimeFromIndex,
  calculateEndTime,
  getNextDay,
  getPreviousDay,
  getLastAvailableStartTime,
} from '../utils/timeSlotUtils';

export interface UseSlotNavigationProps {
  /** Current start time (controlled from parent) */
  startTime: string;

  /** Current duration in minutes (controlled from parent) */
  duration: number;

  /** Number of forward slots shown (navigation jumps by duration * forwardSlotCount) */
  forwardSlotCount?: number;

  /** Maximum end time (pool closing or booking constraint) */
  maxEndTime?: string;

  /** Callback when navigation action occurs */
  onNavigate: (startTime: string, endTime: string, duration: number) => void;

  /** Current date for cross-day navigation (011-smart-slot-selection) */
  date?: string;

  /** Callback when date changes due to cross-day navigation (011-smart-slot-selection) */
  onDateChange?: (date: string) => void;
}

export interface UseSlotNavigationReturn {
  /** Current slot index (derived from startTime) */
  currentSlotIndex: number;

  /** Current start time (pass-through for display) */
  startTime: string;

  /** Current end time (derived from startTime + duration) */
  endTime: string;

  /** Current duration (pass-through for display) */
  duration: number;

  /** Whether previous slot navigation is available */
  canNavigatePrevious: boolean;

  /** Whether next slot navigation is available */
  canNavigateNext: boolean;

  /** Whether duration can be extended by 30 minutes */
  canExtend: boolean;

  /** Whether duration can be reduced by 30 minutes */
  canReduce: boolean;

  /** Navigate to previous time slot */
  navigatePrevious: () => void;

  /** Navigate to next time slot */
  navigateNext: () => void;

  /** Extend duration by 30 minutes */
  extendDuration: () => void;

  /** Reduce duration by 30 minutes */
  reduceDuration: () => void;

  /** Handle keyboard events for navigation */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function useSlotNavigation({
  startTime,
  duration,
  forwardSlotCount = 1,
  maxEndTime = SLOT_CONSTANTS.LAST_SLOT,
  onNavigate,
  date,
  onDateChange,
}: UseSlotNavigationProps): UseSlotNavigationReturn {
  // Number of 30-min slot indices to jump per navigation step
  // = (duration / 30) * forwardSlotCount
  const navigationStep = Math.max(1, (duration / SLOT_CONSTANTS.DURATION_STEP) * forwardSlotCount);

  // Whether cross-day navigation is enabled (requires both date and onDateChange)
  const crossDayEnabled = !!(date && onDateChange);

  // Computed values (all derived from props)
  const currentSlotIndex = useMemo(
    () => getSlotIndex(startTime),
    [startTime]
  );

  const endTime = useMemo(
    () => calculateEndTime(startTime, duration),
    [startTime, duration]
  );

  // Navigation boundaries — with cross-day support
  const canNavigateWithinDayPrevious = currentSlotIndex - navigationStep >= SLOT_CONSTANTS.FIRST_SLOT_INDEX;
  const canNavigateWithinDayNext = currentSlotIndex + navigationStep <= SLOT_CONSTANTS.LAST_SLOT_INDEX;

  // Cross-day: at boundary AND cross-day enabled
  const atFirstSlot = !canNavigateWithinDayPrevious;
  const atLastSlot = !canNavigateWithinDayNext;

  const canNavigatePrevious = canNavigateWithinDayPrevious || (atFirstSlot && crossDayEnabled);
  const canNavigateNext = canNavigateWithinDayNext || (atLastSlot && crossDayEnabled);

  // Duration boundaries (computed from props)
  const canExtend = useMemo(() => {
    const potentialEndTime = calculateEndTime(startTime, duration + SLOT_CONSTANTS.DURATION_STEP);
    const potentialEndMinutes = timeToMinutes(potentialEndTime);
    const maxEndMinutes = timeToMinutes(maxEndTime);
    const currentEndMinutes = timeToMinutes(endTime);

    return potentialEndMinutes > currentEndMinutes && potentialEndMinutes <= maxEndMinutes;
  }, [startTime, duration, maxEndTime, endTime]);

  const canReduce = duration > SLOT_CONSTANTS.MIN_DURATION;

  // Actions - all call onNavigate instead of internal setState
  const navigatePrevious = useCallback(() => {
    if (!canNavigatePrevious) return;

    if (canNavigateWithinDayPrevious) {
      // Normal within-day navigation
      const newIndex = currentSlotIndex - navigationStep;
      const newStartTime = getTimeFromIndex(newIndex);
      const newEndTime = calculateEndTime(newStartTime, duration);
      onNavigate(newStartTime, newEndTime, duration);
    } else if (crossDayEnabled && date) {
      // Cross-day: go to previous day's last available slot
      const newStartTime = getLastAvailableStartTime(duration);
      const newEndTime = calculateEndTime(newStartTime, duration);
      onNavigate(newStartTime, newEndTime, duration);
      onDateChange!(getPreviousDay(date));
    }
  }, [canNavigatePrevious, canNavigateWithinDayPrevious, crossDayEnabled, currentSlotIndex, navigationStep, duration, onNavigate, date, onDateChange]);

  const navigateNext = useCallback(() => {
    if (!canNavigateNext) return;

    if (canNavigateWithinDayNext) {
      // Normal within-day navigation
      const newIndex = currentSlotIndex + navigationStep;
      const newStartTime = getTimeFromIndex(newIndex);
      const newEndTime = calculateEndTime(newStartTime, duration);
      onNavigate(newStartTime, newEndTime, duration);
    } else if (crossDayEnabled && date) {
      // Cross-day: go to next day's first slot
      const newStartTime = SLOT_CONSTANTS.FIRST_SLOT;
      const newEndTime = calculateEndTime(newStartTime, duration);
      onNavigate(newStartTime, newEndTime, duration);
      onDateChange!(getNextDay(date));
    }
  }, [canNavigateNext, canNavigateWithinDayNext, crossDayEnabled, currentSlotIndex, navigationStep, duration, onNavigate, date, onDateChange]);

  const extendDuration = useCallback(() => {
    if (!canExtend) return;

    const newDuration = duration + SLOT_CONSTANTS.DURATION_STEP;
    const newEndTime = calculateEndTime(startTime, newDuration);
    onNavigate(startTime, newEndTime, newDuration);
  }, [canExtend, duration, startTime, onNavigate]);

  const reduceDuration = useCallback(() => {
    if (!canReduce) return;

    const newDuration = duration - SLOT_CONSTANTS.DURATION_STEP;
    const newEndTime = calculateEndTime(startTime, newDuration);
    onNavigate(startTime, newEndTime, newDuration);
  }, [canReduce, duration, startTime, onNavigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          reduceDuration();
          break;
        case 'ArrowDown':
          e.preventDefault();
          extendDuration();
          break;
      }
    },
    [navigatePrevious, navigateNext, reduceDuration, extendDuration]
  );

  return {
    currentSlotIndex,
    startTime,
    endTime,
    duration,
    canNavigatePrevious,
    canNavigateNext,
    canExtend,
    canReduce,
    navigatePrevious,
    navigateNext,
    extendDuration,
    reduceDuration,
    handleKeyDown,
  };
}
