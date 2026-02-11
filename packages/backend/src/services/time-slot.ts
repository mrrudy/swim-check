/**
 * TimeSlotService - Smart default time slot logic
 * - Start time: current time + 30 minutes, rounded down to nearest half hour
 * - End time: start time + user's preferred duration (default 1 hour)
 */

import { getOrCreatePreferences } from '../db/queries.js';

export interface DefaultTimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  durationMins: number;
}

/**
 * Calculate the default start time: current time + 30 mins, rounded down to nearest half hour
 * Example: 14:17 -> 14:30 + 30 = 15:00 -> round down -> 14:30
 * Example: 14:45 -> 15:00 + 30 = 15:30 -> round down -> 15:00
 */
export function calculateDefaultStartTime(now: Date = new Date()): { date: string; time: string } {
  // Add 30 minutes to current time
  const futureTime = new Date(now.getTime() + 30 * 60 * 1000);

  // Round down to nearest 30-minute mark
  const minutes = futureTime.getMinutes();
  const roundedMinutes = minutes < 30 ? 0 : 30;

  futureTime.setMinutes(roundedMinutes, 0, 0);

  // Format date as YYYY-MM-DD (using local time to stay consistent with getHours())
  const year = futureTime.getFullYear();
  const month = (futureTime.getMonth() + 1).toString().padStart(2, '0');
  const day = futureTime.getDate().toString().padStart(2, '0');
  let date = `${year}-${month}-${day}`;

  // Format time as HH:MM
  const hours = futureTime.getHours().toString().padStart(2, '0');
  const mins = futureTime.getMinutes().toString().padStart(2, '0');
  let time = `${hours}:${mins}`;

  // Operating-hours clamping (011-smart-slot-selection)
  if (time >= '22:00') {
    // After closing: advance to next day at opening
    const nextDay = new Date(futureTime);
    nextDay.setDate(nextDay.getDate() + 1);
    const ny = nextDay.getFullYear();
    const nm = (nextDay.getMonth() + 1).toString().padStart(2, '0');
    const nd = nextDay.getDate().toString().padStart(2, '0');
    date = `${ny}-${nm}-${nd}`;
    time = '05:00';
  } else if (time < '05:00') {
    // Before opening: clamp to opening time, same day
    time = '05:00';
  }

  return { date, time };
}

/**
 * Calculate the end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMins: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMins;

  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  // Clamp to 22:00 (pool closing time)
  if (endHours >= 22) {
    return '22:00';
  }

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

/**
 * Get the default time slot based on current time and user preferences
 */
export function getDefaultTimeSlot(now: Date = new Date()): DefaultTimeSlot {
  const prefs = getOrCreatePreferences();
  const durationMins = prefs.slotDurationMins;

  const { date, time: startTime } = calculateDefaultStartTime(now);
  const endTime = calculateEndTime(startTime, durationMins);

  return {
    date,
    startTime,
    endTime,
    durationMins,
  };
}

/**
 * Validate that a time string is in HH:MM format and on a 30-minute boundary
 */
export function validateTimeSlot(time: string): boolean {
  const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return false;

  const minutes = parseInt(match[2]);
  return minutes === 0 || minutes === 30;
}
