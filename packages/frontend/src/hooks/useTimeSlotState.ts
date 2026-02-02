/**
 * useTimeSlotState - Unified state management hook for time slot selection
 * Single source of truth consumed by both TimeSlotPicker and SlotNavigationButtons
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  TIME_OPTIONS,
  SLOT_CONSTANTS,
  getSlotIndex,
  calculateDuration,
  calculateEndTime,
} from '../utils/timeSlotUtils';
import { api } from '../services/api';

/**
 * Represents the current time slot selection state.
 * This is the shared state between all selection UI mechanisms.
 */
export interface TimeSlotState {
  /** Selected date in YYYY-MM-DD format */
  date: string;

  /** Start time in HH:MM format (05:00-22:00 range) */
  startTime: string;

  /** End time in HH:MM format (05:30-22:00 range, must be > startTime) */
  endTime: string;

  /** Duration in minutes (derived: endTime - startTime, 30-480 range) */
  duration: number;

  /** Slot index for navigation (derived: 0-34 based on startTime) */
  slotIndex: number;
}

/**
 * Represents the auto-refresh mechanism state.
 */
export interface RefreshState {
  /** Timer ID for the pending debounce, null if no timer active */
  pendingTimerId: ReturnType<typeof setTimeout> | null;

  /** Whether a refresh API call is currently in flight */
  isRefreshing: boolean;

  /** AbortController for canceling in-flight requests */
  abortController: AbortController | null;

  /** Timestamp of last successful refresh (for staleness display) */
  lastRefreshedAt: Date | null;

  /** Whether initial page load refresh has occurred */
  hasInitialRefresh: boolean;
}

export interface UseTimeSlotStateProps {
  /** Default duration from user preferences (fetched from API) */
  defaultDuration?: number;
}

export interface UseTimeSlotStateReturn {
  /** Current time slot state */
  state: TimeSlotState;

  /** Set the selected date */
  setDate: (date: string) => void;

  /** Set the start time (adjusts end time to preserve duration) */
  setStartTime: (startTime: string) => void;

  /** Set the end time */
  setEndTime: (endTime: string) => void;

  /** Handle navigation changes from arrow controls */
  handleNavigation: (startTime: string, endTime: string, duration: number) => void;

  /** Whether state has been initialized (from API or defaults) */
  isInitialized: boolean;
}

function getDefaultDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getDefaultStartTime(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  // Round up to next 30-minute mark, then add 30 minutes
  const roundedMinutes = minutes < 30 ? 30 : 0;
  const roundedHours = minutes < 30 ? hours : hours + 1;
  const targetHours = roundedMinutes === 0 ? roundedHours : roundedHours;
  const targetMinutes = roundedMinutes === 0 ? 30 : roundedMinutes + 30;

  const finalHours = targetMinutes >= 60 ? targetHours + 1 : targetHours;
  const finalMinutes = targetMinutes >= 60 ? targetMinutes - 60 : targetMinutes;

  // Clamp to available range
  if (finalHours < 5) return SLOT_CONSTANTS.FIRST_SLOT;
  if (finalHours >= 22) return '21:00';

  return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}

function validateStartTime(time: string): string {
  // Must be in valid 30-min increments between 05:00 and 21:30
  const index = TIME_OPTIONS.indexOf(time);
  if (index === -1 || index > SLOT_CONSTANTS.LAST_SLOT_INDEX - 1) {
    // Invalid time, return first valid slot
    return SLOT_CONSTANTS.FIRST_SLOT;
  }
  return time;
}

function validateEndTime(endTime: string, startTime: string): string {
  const startIndex = TIME_OPTIONS.indexOf(startTime);
  const endIndex = TIME_OPTIONS.indexOf(endTime);

  // End time must be after start time and within range
  if (endIndex === -1 || endIndex <= startIndex) {
    // Default to start time + 30 minutes
    return calculateEndTime(startTime, SLOT_CONSTANTS.MIN_DURATION);
  }

  return endTime;
}

export function useTimeSlotState(
  props: UseTimeSlotStateProps = {}
): UseTimeSlotStateReturn {
  const { defaultDuration = 60 } = props;

  // Core state
  const [date, setDateInternal] = useState(getDefaultDate());
  const [startTime, setStartTimeInternal] = useState(getDefaultStartTime());
  const [endTime, setEndTimeInternal] = useState(() =>
    calculateEndTime(getDefaultStartTime(), defaultDuration)
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedDuration, setSavedDuration] = useState(defaultDuration);

  // Derived values
  const duration = useMemo(
    () => calculateDuration(startTime, endTime),
    [startTime, endTime]
  );

  const slotIndex = useMemo(
    () => getSlotIndex(startTime),
    [startTime]
  );

  // Create state object
  const state: TimeSlotState = useMemo(
    () => ({
      date,
      startTime,
      endTime,
      duration,
      slotIndex,
    }),
    [date, startTime, endTime, duration, slotIndex]
  );

  // Fetch default time slot from server on mount
  useEffect(() => {
    api.getDefaultTimeSlot()
      .then((defaultSlot) => {
        setDateInternal(defaultSlot.date);
        setStartTimeInternal(defaultSlot.startTime);
        setEndTimeInternal(defaultSlot.endTime);
        setSavedDuration(defaultSlot.durationMins);
        setIsInitialized(true);
      })
      .catch((err) => {
        console.warn('Failed to fetch default time slot:', err);
        setIsInitialized(true);
      });
  }, []);

  // State setters with validation
  const setDate = useCallback((newDate: string) => {
    setDateInternal(newDate);
  }, []);

  const setStartTime = useCallback((newStartTime: string) => {
    const validStartTime = validateStartTime(newStartTime);
    setStartTimeInternal(validStartTime);

    // Adjust end time to preserve duration (use saved duration)
    const newEndTime = calculateEndTime(validStartTime, savedDuration);
    setEndTimeInternal(newEndTime);
  }, [savedDuration]);

  const setEndTime = useCallback((newEndTime: string) => {
    setEndTimeInternal((prevEndTime) => {
      const validEndTime = validateEndTime(newEndTime, startTime);

      // Save duration preference when user changes end time
      const newDuration = calculateDuration(startTime, validEndTime);
      if (
        newDuration >= SLOT_CONSTANTS.MIN_DURATION &&
        newDuration <= SLOT_CONSTANTS.MAX_DURATION &&
        newDuration % 30 === 0
      ) {
        setSavedDuration(newDuration);
        // Save to server
        api.updatePreferences(newDuration).catch((err) => {
          console.warn('Failed to save duration preference:', err);
        });
      }

      return validEndTime;
    });
  }, [startTime]);

  // Navigation handler for arrow controls
  const handleNavigation = useCallback(
    (newStartTime: string, newEndTime: string, newDuration: number) => {
      const validStartTime = validateStartTime(newStartTime);
      const validEndTime = validateEndTime(newEndTime, validStartTime);

      setStartTimeInternal(validStartTime);
      setEndTimeInternal(validEndTime);
      setSavedDuration(newDuration);
    },
    []
  );

  return {
    state,
    setDate,
    setStartTime,
    setEndTime,
    handleNavigation,
    isInitialized,
  };
}
