/**
 * Centrum Sleza scraper implementation
 * Fetches schedule from public Google Sheets document and parses lane availability
 * Uses Google Sheets API v4 with includeGridData to get cell formatting (background colors)
 *
 * Data source: https://docs.google.com/spreadsheets/d/13tqiOBZubRID83MU6suo7ZyfvCQfjP-p9Z1vaozmioE/edit?gid=74077863
 * Schedule page: https://www.centrumsleza.pl/grafiki/
 */

import { sheets, type sheets_v4 } from '@googleapis/sheets';
import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability } from '@swim-check/shared';
import {
  parseCellData,
  filterSlotsForTimeSlot,
  SHEET_STRUCTURE,
  type CellData,
} from './parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';
import { config } from '../../../config.js';

// Pool configuration
export const SLEZA_POOL_ID = '00000000-0000-0000-0000-000000000003';
export const SLEZA_SCHEDULE_PAGE_URL = 'https://www.centrumsleza.pl/grafiki/';

// Google Sheets configuration
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: '13tqiOBZubRID83MU6suo7ZyfvCQfjP-p9Z1vaozmioE',
  SHEET_GID: 74077863,
  SHEET_NAME: 'BASEN',
  // Range covers the full schedule: time column + 7 days * 6 lanes each
  DATA_RANGE: 'BASEN!A1:AQ72',
};

/**
 * Get the Google Sheets API client configured with API key
 */
function getSheetsClient(): sheets_v4.Sheets {
  if (!config.googleSheetsApiKey) {
    throw new Error('GOOGLE_SHEETS_API_KEY environment variable is not set');
  }

  return sheets({
    version: 'v4',
    auth: config.googleSheetsApiKey,
  });
}

/**
 * Fetch cell data including background colors using Google Sheets API v4
 * The key is using includeGridData=true which returns cell formatting
 */
async function fetchSheetData(): Promise<{ cells: CellData[]; weekStartDate: Date }> {
  const sheets = getSheetsClient();

  // Fetch spreadsheet with grid data (includes cell formatting)
  const response = await sheets.spreadsheets.get({
    spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
    ranges: [GOOGLE_SHEETS_CONFIG.DATA_RANGE],
    includeGridData: true,
  });

  const cells = parseGridData(response.data);
  const weekStartDate = getWeekStartDate();

  return { cells, weekStartDate };
}

/** Merge range from Google Sheets */
interface MergeRange {
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

/**
 * Parse the grid data from Google Sheets API response
 * Extracts cell positions and background colors
 * Handles merged cells by propagating the merge origin's color to all cells in the range
 */
function parseGridData(spreadsheet: sheets_v4.Schema$Spreadsheet): CellData[] {
  const cells: CellData[] = [];

  const sheets = spreadsheet.sheets;
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets found in spreadsheet');
    return cells;
  }

  // Find the BASEN sheet by GID
  const targetSheet = sheets.find(
    (sheet: sheets_v4.Schema$Sheet) => sheet.properties?.sheetId === GOOGLE_SHEETS_CONFIG.SHEET_GID
  );

  if (!targetSheet) {
    console.warn(`Sheet with GID ${GOOGLE_SHEETS_CONFIG.SHEET_GID} not found`);
    return cells;
  }

  const gridData = targetSheet.data;
  if (!gridData || gridData.length === 0) {
    console.warn('No grid data found in sheet');
    return cells;
  }

  // Extract merge ranges from sheet properties
  const merges: MergeRange[] = (targetSheet.merges ?? []).map((m) => ({
    startRowIndex: m.startRowIndex ?? 0,
    endRowIndex: m.endRowIndex ?? 0,
    startColumnIndex: m.startColumnIndex ?? 0,
    endColumnIndex: m.endColumnIndex ?? 0,
  }));

  // First pass: collect all cells with their background colors
  const cellMap = new Map<string, CellData>();

  for (const grid of gridData) {
    const startRow = grid.startRow ?? 0;
    const startCol = grid.startColumn ?? 0;
    const rowData = grid.rowData;

    if (!rowData) continue;

    for (let rowOffset = 0; rowOffset < rowData.length; rowOffset++) {
      const row = rowData[rowOffset];
      const values = row.values;

      if (!values) continue;

      for (let colOffset = 0; colOffset < values.length; colOffset++) {
        const cell = values[colOffset];
        const backgroundColor = cell.effectiveFormat?.backgroundColor;

        const cellRow = startRow + rowOffset;
        const cellCol = startCol + colOffset;
        const key = `${cellRow},${cellCol}`;

        // Store cell data (even if no background color, we need position info)
        if (backgroundColor) {
          cellMap.set(key, {
            row: cellRow,
            col: cellCol,
            backgroundColor: {
              red: backgroundColor.red ?? undefined,
              green: backgroundColor.green ?? undefined,
              blue: backgroundColor.blue ?? undefined,
            },
          });
        }
      }
    }
  }

  // Second pass: expand merged cells
  // For each merge, propagate the top-left cell's color to all cells in the range
  for (const merge of merges) {
    const originKey = `${merge.startRowIndex},${merge.startColumnIndex}`;
    const originCell = cellMap.get(originKey);

    // Propagate the origin cell's color to all cells in the merge range
    // If origin has no background color, we still need to mark the cells as part of a merge
    // so they don't get treated as "no data = free"
    const backgroundColor = originCell?.backgroundColor;

    for (let row = merge.startRowIndex; row < merge.endRowIndex; row++) {
      for (let col = merge.startColumnIndex; col < merge.endColumnIndex; col++) {
        const key = `${row},${col}`;
        cellMap.set(key, {
          row,
          col,
          backgroundColor,
        });
      }
    }
  }

  // Convert map back to array
  return Array.from(cellMap.values());
}

/**
 * Get the Monday of the current week
 */
function getWeekStartDate(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust when day is Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export class SlezaCentrumScraper implements PoolScraper {
  readonly poolId = SLEZA_POOL_ID;
  readonly name = 'sleza-centrum';
  readonly version = '1.0.0';
  readonly sourceUrls = [
    { url: SLEZA_SCHEDULE_PAGE_URL, label: 'Schedule Page' },
    { url: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}`, label: 'Google Sheets' },
  ];

  async fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]> {
    const lanes = getLanesByPoolId(this.poolId);
    const laneIds = new Map<number, string>();
    lanes.forEach((lane) => laneIds.set(lane.laneNumber, lane.id));

    // If no lanes in DB, return empty (pool not seeded yet)
    if (lanes.length === 0) {
      console.warn('Sleza pool not found in database - needs seeding');
      return [];
    }

    try {
      // Fetch and parse the Google Sheets data
      const { cells, weekStartDate } = await fetchSheetData();

      // Parse into structured schedule
      const schedule = parseCellData(cells, weekStartDate);

      // Filter for the requested time slot
      return filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);
    } catch (error) {
      console.error('Error fetching Sleza availability:', error);
      // Return default availability on error
      return this.getDefaultAvailability(laneIds);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(SLEZA_SCHEDULE_PAGE_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getDefaultAvailability(laneIds: Map<number, string>): LaneAvailability[] {
    const now = new Date();
    return Array.from(laneIds.entries()).map(([laneNumber, laneId]) => ({
      laneId,
      laneNumber,
      isAvailable: true, // Assume available when we can't fetch data
      lastUpdated: now,
    }));
  }
}

export const slezaCentrumScraper = new SlezaCentrumScraper();
