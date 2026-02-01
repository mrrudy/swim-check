/**
 * Time slot utility functions for slot navigation
 */

/** Pool operating hours and slot constants */
export const SLOT_CONSTANTS = {
  /** First available time slot */
  FIRST_SLOT: '05:00',

  /** Last available time slot (pool closing) */
  LAST_SLOT: '22:00',

  /** Minimum booking duration in minutes */
  MIN_DURATION: 30,

  /** Maximum booking duration in minutes */
  MAX_DURATION: 480, // 8 hours

  /** Duration adjustment step in minutes */
  DURATION_STEP: 30,

  /** Total number of time slots */
  SLOT_COUNT: 35, // (22-5)*2 + 1

  /** First slot index */
  FIRST_SLOT_INDEX: 0,

  /** Last slot index */
  LAST_SLOT_INDEX: 34,
} as const;

/**
 * Generate all available time options at 30-minute intervals (05:00 to 22:00)
 */
export function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Stop at 22:00, don't include 22:30
      if (hour === 22 && minute > 0) break;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(time);
    }
  }
  return times;
}

/** All available time slots from 05:00 to 22:00 */
export const TIME_OPTIONS = generateTimeOptions();

/**
 * Get the index of a time in the TIME_OPTIONS array
 * @param time - Time string in HH:MM format
 * @returns Index (0-34) or -1 if not found
 */
export function getSlotIndex(time: string): number {
  return TIME_OPTIONS.indexOf(time);
}

/**
 * Get the time string at a given index
 * @param index - Index into TIME_OPTIONS (0-34)
 * @returns Time string in HH:MM format, clamped to valid range
 */
export function getTimeFromIndex(index: number): string {
  const clampedIndex = Math.max(
    SLOT_CONSTANTS.FIRST_SLOT_INDEX,
    Math.min(SLOT_CONSTANTS.LAST_SLOT_INDEX, index)
  );
  return TIME_OPTIONS[clampedIndex];
}

/**
 * Calculate the end time given a start time and duration
 * @param startTime - Start time in HH:MM format
 * @param durationMins - Duration in minutes
 * @returns End time in HH:MM format, clamped to pool closing (22:00)
 */
export function calculateEndTime(startTime: string, durationMins: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  // Clamp to pool closing time
  if (endHours >= 22) {
    return SLOT_CONSTANTS.LAST_SLOT;
  }

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate duration in minutes between two times
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

/**
 * Check if extending duration is allowed
 * @param startTime - Start time in HH:MM format
 * @param currentDuration - Current duration in minutes
 * @returns Whether duration can be extended by 30 minutes
 */
export function canExtendDuration(startTime: string, currentDuration: number): boolean {
  const newEndTime = calculateEndTime(startTime, currentDuration + SLOT_CONSTANTS.DURATION_STEP);
  return newEndTime !== SLOT_CONSTANTS.LAST_SLOT ||
         calculateDuration(startTime, newEndTime) > currentDuration;
}

/**
 * Check if reducing duration is allowed
 * @param currentDuration - Current duration in minutes
 * @returns Whether duration can be reduced by 30 minutes
 */
export function canReduceDuration(currentDuration: number): boolean {
  return currentDuration > SLOT_CONSTANTS.MIN_DURATION;
}
