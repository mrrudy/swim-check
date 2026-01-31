/**
 * PDF parsing logic for Aquapark Wrocław Borowska
 * Extracts 8-lane weekly schedule from reservation PDF
 * Lanes 1-8, 30-min slots from 05:00-21:30
 * Booking categories: schools, companies, aquaerobics, swimming lessons
 */

import type { LaneAvailability, TimeSlot } from '@swim-check/shared';

/** Text item with position from PDF */
interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Parsed schedule for a single day */
interface DaySchedule {
  dayIndex: number; // 0 = Monday, 6 = Sunday
  timeSlots: string[]; // Array of time strings like '09:00'
  columns: ColumnInfo[];
  lanes: LaneData[];
}

/** Column position info */
interface ColumnInfo {
  time: string;
  xStart: number;
  xEnd: number;
}

/** Lane availability data for a day */
interface LaneData {
  laneNumber: number;
  availability: boolean[]; // true = available for each time slot
}

/** Full parsed schedule from PDF */
export interface ParsedSchedule {
  days: DaySchedule[];
  timeSlots: string[];
  weekStartDate?: Date;
}

/**
 * Extract text items with positions from PDF buffer
 */
export async function extractTextItems(pdfBuffer: Buffer): Promise<TextItem[]> {
  const pdfParse = (await import('pdf-parse')).default;
  const items: TextItem[] = [];

  const options = {
    pagerender: async function(pageData: any) {
      const textContent = await pageData.getTextContent();

      for (const item of textContent.items) {
        if ('str' in item && item.str.trim()) {
          const transform = item.transform;
          items.push({
            str: item.str,
            x: transform[4],
            y: transform[5],
            width: item.width as number,
            height: item.height as number,
          });
        }
      }

      return '';
    }
  };

  await pdfParse(pdfBuffer, options);
  return items;
}

/**
 * Parse PDF text items into a structured schedule
 */
export function parseTextItems(items: TextItem[]): ParsedSchedule {
  // Sort items by Y (descending - PDF coords from bottom) then X
  items.sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.x - b.x;
  });

  // Group items by rows (similar Y values)
  const rows = groupByRows(items, 3);

  // Find header rows (contain "Godzina")
  const headerRowIndices: number[] = [];
  rows.forEach((row, index) => {
    if (row.some(item => item.str === 'Godzina')) {
      headerRowIndices.push(index);
    }
  });

  // Parse each day's schedule
  const days: DaySchedule[] = [];

  for (let dayIdx = 0; dayIdx < headerRowIndices.length; dayIdx++) {
    const headerRowIndex = headerRowIndices[dayIdx];
    const headerRow = rows[headerRowIndex];

    // Get time slots from header
    const timeItems = headerRow
      .filter(item => /^\d{2}:\d{2}$/.test(item.str))
      .sort((a, b) => a.x - b.x);

    if (timeItems.length === 0) continue;

    const timeSlots = timeItems.map(t => t.str);

    // Create column boundaries
    const columns: ColumnInfo[] = [];
    for (let i = 0; i < timeItems.length; i++) {
      const current = timeItems[i];
      const next = timeItems[i + 1];
      columns.push({
        time: current.str,
        xStart: current.x - 5,
        xEnd: next ? (current.x + next.x) / 2 : current.x + 30,
      });
    }

    // Find lane rows for this day
    // Lane rows are below the header (lower Y in sorted order = higher row index)
    const headerY = headerRow[0].y;
    const nextHeaderY = headerRowIndices[dayIdx + 1] !== undefined
      ? rows[headerRowIndices[dayIdx + 1]][0].y
      : -Infinity;

    // Collect all items between this header and next header (or end)
    const laneItems: TextItem[] = [];
    for (const row of rows) {
      const rowY = row[0]?.y;
      if (rowY && rowY < headerY && rowY > nextHeaderY) {
        laneItems.push(...row);
      }
    }

    // Group lane items by unique lane numbers found
    const lanesMap = new Map<number, LaneData>();

    for (let laneNum = 1; laneNum <= 8; laneNum++) {
      // For each column, check if lane number exists
      // A lane is available at a time slot if the lane number appears in that column
      const availability = columns.map(col => {
        // Check if any item with this lane number falls within this column
        return laneItems.some(item =>
          item.str === String(laneNum) &&
          item.x >= col.xStart &&
          item.x < col.xEnd
        );
      });

      lanesMap.set(laneNum, {
        laneNumber: laneNum,
        availability,
      });
    }

    days.push({
      dayIndex: dayIdx, // 0 = first day in PDF (typically Monday)
      timeSlots,
      columns,
      lanes: Array.from(lanesMap.values()).sort((a, b) => a.laneNumber - b.laneNumber),
    });
  }

  // Collect all unique time slots
  const allTimeSlots = [...new Set(days.flatMap(d => d.timeSlots))].sort();

  return { days, timeSlots: allTimeSlots };
}

/**
 * Group text items by rows (similar Y values)
 */
function groupByRows(items: TextItem[], yTolerance: number): TextItem[][] {
  if (items.length === 0) return [];

  // Sort by Y descending, then X ascending
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > yTolerance) return yDiff;
    return a.x - b.x;
  });

  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [sorted[0]];
  let lastY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - lastY) <= yTolerance) {
      currentRow.push(item);
    } else {
      rows.push([...currentRow].sort((a, b) => a.x - b.x));
      currentRow = [item];
      lastY = item.y;
    }
  }

  if (currentRow.length > 0) {
    rows.push([...currentRow].sort((a, b) => a.x - b.x));
  }

  return rows;
}

/**
 * Parse PDF buffer to extract schedule with position awareness
 */
export async function parsePdfBuffer(pdfBuffer: Buffer): Promise<ParsedSchedule> {
  const items = await extractTextItems(pdfBuffer);
  return parseTextItems(items);
}

/**
 * Get the day of week index (0 = Monday, 6 = Sunday) from a Date
 */
function getDayOfWeekIndex(date: Date): number {
  const jsDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0 = Monday
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
  const daySchedule = schedule.days.find(d => d.dayIndex === dayOfWeek);

  if (!daySchedule) {
    console.warn(`No schedule found for day of week ${dayOfWeek}`);
    // Return all lanes as available (no data)
    return Array.from(laneIds.entries()).map(([laneNumber, laneId]) => ({
      laneId,
      laneNumber,
      isAvailable: true,
      lastUpdated: now,
    }));
  }

  // Find the time slot indices that overlap with the requested time range
  const relevantSlotIndices: number[] = [];

  for (let i = 0; i < daySchedule.timeSlots.length; i++) {
    const slotTime = daySchedule.timeSlots[i];
    // A slot is relevant if it starts within the requested time range
    if (slotTime >= timeSlot.startTime && slotTime < timeSlot.endTime) {
      relevantSlotIndices.push(i);
    }
  }

  // If no relevant slots found, try to find the exact start time
  if (relevantSlotIndices.length === 0) {
    const startIdx = daySchedule.timeSlots.indexOf(timeSlot.startTime);
    if (startIdx >= 0) {
      relevantSlotIndices.push(startIdx);
    }
  }

  // For each lane, check if it's available during all relevant time slots
  const results: LaneAvailability[] = [];

  for (const [laneNumber, laneId] of laneIds) {
    const laneData = daySchedule.lanes.find(l => l.laneNumber === laneNumber);

    if (!laneData) {
      // No data for this lane - assume available
      results.push({
        laneId,
        laneNumber,
        isAvailable: true,
        lastUpdated: now,
      });
      continue;
    }

    // Lane is available only if available for ALL relevant time slots
    const isAvailable = relevantSlotIndices.length === 0 ||
      relevantSlotIndices.every(idx => idx >= 0 && idx < laneData.availability.length && laneData.availability[idx]);

    results.push({
      laneId,
      laneNumber,
      isAvailable,
      lastUpdated: now,
    });
  }

  return results.sort((a, b) => a.laneNumber - b.laneNumber);
}

/**
 * Generate time slots for a typical pool operating day (05:00-21:30)
 */
export function generateDayTimeSlots(): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];

  for (let hour = 5; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 21 && minute === 30) break;

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      slots.push({ startTime, endTime });
    }
  }

  return slots;
}
