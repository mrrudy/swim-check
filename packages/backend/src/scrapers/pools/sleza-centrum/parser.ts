/**
 * Google Sheets parsing logic for Centrum Sleza
 * Extracts 6-lane weekly schedule from public Google Sheets document
 * Lanes 1-6 (BASEN SPORTOWY), 15-min slots from 06:00-22:00
 * Colors: white/light gray = free, colored = booked
 */

import type { LaneAvailability, TimeSlot } from '@swim-check/shared';

/** Cell data with background color */
export interface CellData {
  row: number;
  col: number;
  backgroundColor?: RgbColor;
}

/** RGB color representation */
export interface RgbColor {
  red?: number;
  green?: number;
  blue?: number;
}

/** Parsed schedule for a single day */
export interface DaySchedule {
  date: Date;
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  lanes: LaneData[];
}

/** Lane availability data for a day */
interface LaneData {
  laneNumber: number;
  availability: Map<string, boolean>; // time slot -> available
}

/** Full parsed schedule from Google Sheets */
export interface ParsedSchedule {
  days: DaySchedule[];
  weekStartDate: Date;
  weekEndDate: Date;
}

/**
 * Sheet structure constants
 * Based on analysis of the Google Sheets document
 */
export const SHEET_STRUCTURE = {
  // Row indices (0-based in API)
  HEADER_ROW: 6, // Row 7 contains "TORY" and lane numbers
  FIRST_TIME_ROW: 7, // Row 8 contains first time slot (06:00)

  // Time slot configuration
  FIRST_TIME: '06:00',
  SLOT_DURATION_MINS: 15,
  SLOTS_PER_DAY: 64, // 06:00 to 22:00 = 16 hours * 4 slots

  // Column configuration (0-based)
  TIME_COLUMN: 0, // Column A contains times
  LANES_PER_DAY: 6,

  // Day column offsets (0-based, starting column for each day's lanes)
  // Monday: B-G (1-6), Tuesday: H-M (7-12), etc.
  DAY_COLUMN_OFFSETS: [1, 7, 13, 19, 25, 31, 37] as const, // Mon-Sun
};

/**
 * Determines if a cell background color indicates "free" (available)
 * Free colors: white (#ffffff), light gray (#f3f3f3, #e8e8e8, similar)
 * Booked colors: orange, blue, magenta, yellow, etc.
 */
export function isColorFree(color?: RgbColor): boolean {
  if (!color) {
    // No color = default white = free
    return true;
  }

  // Google Sheets API omits color components that are 0, so default to 0 for missing values
  const { red = 0, green = 0, blue = 0 } = color;

  // Colors from API are 0-1 range, convert to 0-255 for easier comparison
  const r = Math.round(red * 255);
  const g = Math.round(green * 255);
  const b = Math.round(blue * 255);

  // Check for white or near-white (light gray)
  // Free colors typically have high values in all channels (> 220) and are similar to each other
  const isWhiteOrLightGray = r >= 220 && g >= 220 && b >= 220;

  // Also check for very light colors that are close to white
  const avgBrightness = (r + g + b) / 3;
  const isVeryLight = avgBrightness >= 235;

  // Check if all channels are similar (grayscale)
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  const isGrayish = maxDiff < 30;

  return isWhiteOrLightGray || (isVeryLight && isGrayish);
}

/**
 * Convert time row index to time string
 * @param rowIndex 0-based row index from FIRST_TIME_ROW
 * @returns Time string in HH:MM format
 */
export function rowIndexToTime(rowIndex: number): string {
  const totalMinutes = 6 * 60 + rowIndex * SHEET_STRUCTURE.SLOT_DURATION_MINS;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert time string to row index
 * @param time Time string in HH:MM format
 * @returns 0-based row index from FIRST_TIME_ROW, or -1 if invalid
 */
export function timeToRowIndex(time: string): number {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return -1;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 6 || hours > 22) return -1;
  if (minutes % SHEET_STRUCTURE.SLOT_DURATION_MINS !== 0) return -1;

  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 6 * 60;

  return (totalMinutes - startMinutes) / SHEET_STRUCTURE.SLOT_DURATION_MINS;
}

/**
 * Get the day of week index (0 = Monday, 6 = Sunday) from a Date
 */
export function getDayOfWeekIndex(date: Date): number {
  const jsDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Parse cell data from Google Sheets API response into structured schedule
 */
export function parseCellData(
  cells: CellData[],
  weekStartDate: Date
): ParsedSchedule {
  const days: DaySchedule[] = [];

  // Process each day
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayColStart = SHEET_STRUCTURE.DAY_COLUMN_OFFSETS[dayIdx];
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + dayIdx);

    const lanes: LaneData[] = [];

    // Process each lane (1-6)
    for (let laneIdx = 0; laneIdx < SHEET_STRUCTURE.LANES_PER_DAY; laneIdx++) {
      const laneCol = dayColStart + laneIdx;
      const laneNumber = laneIdx + 1;
      const availability = new Map<string, boolean>();

      // Process each time slot
      for (let slotIdx = 0; slotIdx < SHEET_STRUCTURE.SLOTS_PER_DAY; slotIdx++) {
        const time = rowIndexToTime(slotIdx);
        const row = SHEET_STRUCTURE.FIRST_TIME_ROW + slotIdx;

        // Find the cell data for this position
        const cell = cells.find(c => c.row === row && c.col === laneCol);
        const isAvailable = isColorFree(cell?.backgroundColor);

        availability.set(time, isAvailable);
      }

      lanes.push({ laneNumber, availability });
    }

    days.push({
      date: dayDate,
      dayOfWeek: dayIdx,
      lanes,
    });
  }

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return { days, weekStartDate, weekEndDate };
}

/**
 * Filter parsed schedule for a specific date and time slot
 */
export function filterSlotsForTimeSlot(
  schedule: ParsedSchedule,
  date: Date,
  timeSlot: TimeSlot,
  laneIds: Map<number, string>
): LaneAvailability[] {
  const now = new Date();
  const dayOfWeek = getDayOfWeekIndex(date);

  // Find the day schedule for this day of week
  const daySchedule = schedule.days.find(d => d.dayOfWeek === dayOfWeek);

  if (!daySchedule) {
    console.warn(`No schedule found for day of week ${dayOfWeek}`);
    return Array.from(laneIds.entries()).map(([laneNumber, laneId]) => ({
      laneId,
      laneNumber,
      isAvailable: true,
      lastUpdated: now,
    }));
  }

  // Get all time slots within the requested range
  const startIdx = timeToRowIndex(timeSlot.startTime);
  const endIdx = timeToRowIndex(timeSlot.endTime);

  if (startIdx < 0) {
    console.warn(`Invalid start time: ${timeSlot.startTime}`);
    return Array.from(laneIds.entries()).map(([laneNumber, laneId]) => ({
      laneId,
      laneNumber,
      isAvailable: true,
      lastUpdated: now,
    }));
  }

  const results: LaneAvailability[] = [];

  for (const [laneNumber, laneId] of laneIds) {
    const laneData = daySchedule.lanes.find(l => l.laneNumber === laneNumber);

    if (!laneData) {
      results.push({
        laneId,
        laneNumber,
        isAvailable: true,
        lastUpdated: now,
      });
      continue;
    }

    // Check all slots in range - lane is available only if ALL slots are free
    let isAvailable = true;
    const slotsToCheck = endIdx > startIdx ? endIdx - startIdx : 1;

    for (let i = 0; i < slotsToCheck; i++) {
      const time = rowIndexToTime(startIdx + i);
      const slotAvailable = laneData.availability.get(time) ?? true;
      if (!slotAvailable) {
        isAvailable = false;
        break;
      }
    }

    results.push({
      laneId,
      laneNumber,
      isAvailable,
      lastUpdated: now,
    });
  }

  return results.sort((a, b) => a.laneNumber - b.laneNumber);
}
