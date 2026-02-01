/**
 * useSlotNavigation - Hook for keyboard and button navigation between time slots
 */

import { useState, useCallback, useMemo } from 'react';
import {
  TIME_OPTIONS,
  SLOT_CONSTANTS,
  getSlotIndex,
  getTimeFromIndex,
  calculateEndTime,
} from '../utils/timeSlotUtils';

export interface UseSlotNavigationProps {
  /** Initial start time from TimeSlotPicker or API */
  initialStartTime: string;

  /** Initial duration from user preferences */
  initialDuration: number;

  /** Maximum end time (pool closing or booking constraint) */
  maxEndTime?: string;

  /** Callback when slot selection changes */
  onSlotChange: (startTime: string, endTime: string, duration: number) => void;
}

export interface UseSlotNavigationReturn {
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

export function useSlotNavigation({
  initialStartTime,
  initialDuration,
  maxEndTime = SLOT_CONSTANTS.LAST_SLOT,
  onSlotChange,
}: UseSlotNavigationProps): UseSlotNavigationReturn {
  const [currentSlotIndex, setCurrentSlotIndex] = useState(() =>
    getSlotIndex(initialStartTime)
  );
  const [duration, setDuration] = useState(initialDuration);

  // Computed values
  const startTime = useMemo(
    () => getTimeFromIndex(currentSlotIndex),
    [currentSlotIndex]
  );

  const endTime = useMemo(
    () => calculateEndTime(startTime, duration),
    [startTime, duration]
  );

  // Navigation boundaries
  const canNavigatePrevious = currentSlotIndex > SLOT_CONSTANTS.FIRST_SLOT_INDEX;
  const canNavigateNext = currentSlotIndex < SLOT_CONSTANTS.LAST_SLOT_INDEX;

  // Duration boundaries
  const canExtend = useMemo(() => {
    const potentialEndTime = calculateEndTime(startTime, duration + SLOT_CONSTANTS.DURATION_STEP);
    // Can extend if new end time doesn't exceed max (or if it would be clamped but still > current duration)
    const potentialEndMinutes = timeToMinutes(potentialEndTime);
    const maxEndMinutes = timeToMinutes(maxEndTime);
    const currentEndMinutes = timeToMinutes(endTime);

    return potentialEndMinutes > currentEndMinutes && potentialEndMinutes <= maxEndMinutes;
  }, [startTime, duration, maxEndTime, endTime]);

  const canReduce = duration > SLOT_CONSTANTS.MIN_DURATION;

  // Actions
  const navigatePrevious = useCallback(() => {
    if (!canNavigatePrevious) return;

    const newIndex = currentSlotIndex - 1;
    setCurrentSlotIndex(newIndex);

    const newStartTime = getTimeFromIndex(newIndex);
    const newEndTime = calculateEndTime(newStartTime, duration);
    onSlotChange(newStartTime, newEndTime, duration);
  }, [canNavigatePrevious, currentSlotIndex, duration, onSlotChange]);

  const navigateNext = useCallback(() => {
    if (!canNavigateNext) return;

    const newIndex = currentSlotIndex + 1;
    setCurrentSlotIndex(newIndex);

    const newStartTime = getTimeFromIndex(newIndex);
    const newEndTime = calculateEndTime(newStartTime, duration);
    onSlotChange(newStartTime, newEndTime, duration);
  }, [canNavigateNext, currentSlotIndex, duration, onSlotChange]);

  const extendDuration = useCallback(() => {
    if (!canExtend) return;

    const newDuration = duration + SLOT_CONSTANTS.DURATION_STEP;
    setDuration(newDuration);

    const newEndTime = calculateEndTime(startTime, newDuration);
    onSlotChange(startTime, newEndTime, newDuration);
  }, [canExtend, duration, startTime, onSlotChange]);

  const reduceDuration = useCallback(() => {
    if (!canReduce) return;

    const newDuration = duration - SLOT_CONSTANTS.DURATION_STEP;
    setDuration(newDuration);

    const newEndTime = calculateEndTime(startTime, newDuration);
    onSlotChange(startTime, newEndTime, newDuration);
  }, [canReduce, duration, startTime, onSlotChange]);

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

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
