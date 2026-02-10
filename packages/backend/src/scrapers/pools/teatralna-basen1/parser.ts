/**
 * HTML parser for Teatralna Basen 1 schedule page (010-teatralna-pool-scraper)
 *
 * Parses the desktop schedule table from klient.spa.wroc.pl
 * Extracts dates, hourly time slots, and free spot counts.
 */

import * as cheerio from 'cheerio';
import { TEATRALNA_CONFIG } from './config.js';

/** Parsed representation of one day's schedule */
export interface ParsedScheduleDay {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g., "poniedziałek"
  slots: ParsedSlot[];
}

/** Parsed representation of one hourly time slot */
export interface ParsedSlot {
  hour: string; // HH:00 format
  freeSpots: number; // "Wolne miejsca" count (0 if inactive/empty)
  maxSpots: number; // Maximum spots for this slot
  isActive: boolean; // false for inactive/past slots or empty cells
}

/**
 * Convert free spots to available lane count.
 * Only full lanes are counted (partial lanes not useful for lane swimmers).
 */
export function spotsToLanes(freeSpots: number, spotsPerLane: number): number {
  return Math.floor(freeSpots / spotsPerLane);
}

/**
 * Calculate total lane count from max spots.
 * Caps at configured maximum to handle data anomalies.
 */
export function calculateTotalLanes(
  maxSpots: number,
  spotsPerLane: number,
  configuredMaxSpots: number
): number {
  const effectiveMax = Math.min(maxSpots, configuredMaxSpots);
  return Math.floor(effectiveMax / spotsPerLane);
}

/**
 * Parse the schedule table from the Teatralna booking page HTML.
 * Targets `table#schedule` which contains the 7-day weekly grid.
 */
export function parseScheduleTable(html: string): ParsedScheduleDay[] {
  const $ = cheerio.load(html);

  // The AJAX response returns an HTML fragment containing the schedule table.
  // Try table#schedule first (full page / fixture), then fall back to table.schedule (AJAX fragment).
  let table = $('table#schedule');
  if (table.length === 0) {
    table = $('table.schedule');
  }

  if (table.length === 0) {
    throw Object.assign(new Error('Could not find schedule table in HTML'), {
      code: 'PARSE',
    });
  }

  // Extract dates from the header row
  // Header cells contain day name and date: "<small>YYYY-MM-DD</small>"
  const headerRow = table.find('thead tr').first();
  const headers: Array<{ date: string; dayName: string }> = [];

  headerRow.find('th').each((_i, th) => {
    const thEl = $(th);
    const smallText = thEl.find('small').text().trim();
    const fullText = thEl.text().trim();

    // Date is in the <small> element in YYYY-MM-DD format
    const dateMatch = smallText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      // Day name is the text before the date
      const dayName = fullText.replace(smallText, '').trim();
      headers.push({ date: dateMatch[1], dayName });
    }
  });

  if (headers.length === 0) {
    throw Object.assign(
      new Error('No date headers found in schedule table'),
      { code: 'PARSE' }
    );
  }

  // Initialize days
  const days: ParsedScheduleDay[] = headers.map((h) => ({
    date: h.date,
    dayName: h.dayName,
    slots: [],
  }));

  // Parse body rows — each row is one hour
  table.find('tbody tr').each((_rowIdx, tr) => {
    const cells = $(tr).find('td');
    if (cells.length === 0) return;

    // First cell contains the hour
    const hourText = cells.first().text().trim();
    const hourMatch = hourText.match(/^(\d{2}):00$/);
    if (!hourMatch) return;

    const hour = `${hourMatch[1]}:00`;

    // Remaining cells correspond to days (columns 1-7)
    cells.each((cellIdx, td) => {
      if (cellIdx === 0) return; // Skip hour column
      const dayIndex = cellIdx - 1;
      if (dayIndex >= days.length) return;

      const cell = $(td);
      const listEntry = cell.find('.list-entry').first();

      if (listEntry.length === 0) {
        // Empty cell — no session scheduled
        days[dayIndex].slots.push({
          hour,
          freeSpots: 0,
          maxSpots: 0,
          isActive: false,
        });
        return;
      }

      // Check if inactive (past/unavailable)
      const isInactive = listEntry.hasClass('list-entry-inactive');

      if (isInactive) {
        days[dayIndex].slots.push({
          hour,
          freeSpots: 0,
          maxSpots: TEATRALNA_CONFIG.TOTAL_SPOTS,
          isActive: false,
        });
        return;
      }

      // Extract free spots from "Wolne miejsca: N"
      const infoText = listEntry.find('.list-entry-info').text().trim();
      const spotsMatch = infoText.match(/Wolne miejsca:\s*(\d+)/);

      let freeSpots = 0;
      if (spotsMatch) {
        freeSpots = parseInt(spotsMatch[1], 10);
        if (isNaN(freeSpots)) {
          console.warn(
            `[Teatralna] Non-numeric spots value: "${spotsMatch[1]}" at ${hour} on day ${dayIndex}`
          );
          freeSpots = 0;
        }
      }

      days[dayIndex].slots.push({
        hour,
        freeSpots,
        maxSpots: TEATRALNA_CONFIG.TOTAL_SPOTS,
        isActive: true,
      });
    });
  });

  return days;
}
