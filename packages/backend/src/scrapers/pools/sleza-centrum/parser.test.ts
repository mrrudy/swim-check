/**
 * Tests for Centrum Sleza Google Sheets parser
 * Using fixture data based on the schedule from:
 * https://docs.google.com/spreadsheets/d/13tqiOBZubRID83MU6suo7ZyfvCQfjP-p9Z1vaozmioE/edit?gid=74077863
 *
 * Week: 26.01.2026 - 01.02.2026
 * Pool: BASEN SPORTOWY (6 lanes)
 *
 * Verified test cases:
 * 1. Monday 26.01.2026 @ 06:00 - All 6 lanes BOOKED
 * 2. Monday 26.01.2026 @ 06:15 - All 6 lanes BOOKED
 * 3. Monday 26.01.2026 @ 09:15 - 2 BOOKED (blue), 4 FREE
 * 4. Monday 26.01.2026 @ 12:30 - 1 FREE, 5 BOOKED
 * 5. Friday 30.01.2026 @ 07:00 - 3 FREE, 3 BOOKED (orange)
 * 6. Friday 30.01.2026 @ 11:00 - All 6 lanes FREE
 * 7. Saturday 31.01.2026 @ 08:00 - All 6 lanes BOOKED
 * 8. Saturday 31.01.2026 @ 13:30 - 2 BOOKED, 4 FREE
 * 9. Wednesday 28.01.2026 @ 09:00 - 3 FREE, 3 BOOKED
 * 10. Sunday 01.02.2026 @ 10:00 - All 6 lanes FREE
 */

import { describe, it, expect } from 'vitest';
import {
  isColorFree,
  rowIndexToTime,
  timeToRowIndex,
  parseCellData,
  filterSlotsForTimeSlot,
  SHEET_STRUCTURE,
  type CellData,
} from './parser.js';
import type { TimeSlot } from '@swim-check/shared';

// Color constants for testing (0-1 range as returned by Google Sheets API)
const COLORS = {
  WHITE: { red: 1, green: 1, blue: 1 },
  LIGHT_GRAY: { red: 0.95, green: 0.95, blue: 0.95 },
  PEACH: { red: 0.98, green: 0.91, blue: 0.82 },
  ORANGE: { red: 1, green: 0.6, blue: 0 },
  BLUE: { red: 0.26, green: 0.52, blue: 0.96 },
  MAGENTA: { red: 1, green: 0, blue: 1 },
  YELLOW: { red: 1, green: 1, blue: 0 },
};

describe('isColorFree', () => {
  it('should return true for white', () => {
    expect(isColorFree(COLORS.WHITE)).toBe(true);
  });

  it('should return true for light gray', () => {
    expect(isColorFree(COLORS.LIGHT_GRAY)).toBe(true);
  });

  it('should return true for undefined (no color = white)', () => {
    expect(isColorFree(undefined)).toBe(true);
  });

  it('should return false for orange (booked)', () => {
    expect(isColorFree(COLORS.ORANGE)).toBe(false);
  });

  it('should return false for blue (booked)', () => {
    expect(isColorFree(COLORS.BLUE)).toBe(false);
  });

  it('should return false for magenta (closed/booked)', () => {
    expect(isColorFree(COLORS.MAGENTA)).toBe(false);
  });

  it('should return false for yellow (booked)', () => {
    expect(isColorFree(COLORS.YELLOW)).toBe(false);
  });

  // Google Sheets API omits color components that are 0
  // e.g., yellow {red:1, green:1} with missing blue means blue=0
  it('should return false for yellow with missing blue (Google API format)', () => {
    expect(isColorFree({ red: 1, green: 1 })).toBe(false);
  });

  it('should return false for orange with missing blue (Google API format)', () => {
    // {red:1, green:0.6} with missing blue = rgb(255, 153, 0) = orange
    expect(isColorFree({ red: 1, green: 0.6 })).toBe(false);
  });
});

describe('rowIndexToTime', () => {
  it('should convert row index 0 to 06:00', () => {
    expect(rowIndexToTime(0)).toBe('06:00');
  });

  it('should convert row index 4 to 07:00 (4 * 15min = 1h)', () => {
    expect(rowIndexToTime(4)).toBe('07:00');
  });

  it('should convert row index 40 to 16:00 (40 * 15min = 10h)', () => {
    expect(rowIndexToTime(40)).toBe('16:00');
  });

  it('should convert row index 42 to 16:30', () => {
    expect(rowIndexToTime(42)).toBe('16:30');
  });

  it('should convert row index 46 to 17:30', () => {
    expect(rowIndexToTime(46)).toBe('17:30');
  });

  it('should convert row index 50 to 18:30', () => {
    expect(rowIndexToTime(50)).toBe('18:30');
  });
});

describe('timeToRowIndex', () => {
  it('should convert 06:00 to row index 0', () => {
    expect(timeToRowIndex('06:00')).toBe(0);
  });

  it('should convert 16:00 to row index 40', () => {
    expect(timeToRowIndex('16:00')).toBe(40);
  });

  it('should convert 16:30 to row index 42', () => {
    expect(timeToRowIndex('16:30')).toBe(42);
  });

  it('should return -1 for invalid time format', () => {
    expect(timeToRowIndex('invalid')).toBe(-1);
  });

  it('should return -1 for time before 06:00', () => {
    expect(timeToRowIndex('05:00')).toBe(-1);
  });
});

describe('parseCellData and filterSlotsForTimeSlot', () => {
  // Week starts Monday 26.01.2026
  // Day indices: Monday=0, Tuesday=1, Wednesday=2, Thursday=3, Friday=4, Saturday=5, Sunday=6

  /**
   * Create test cells fixture based on verified visual inspection of the schedule
   * Bookings are represented by colored cells (non-white/non-light-gray)
   */
  function createTestCells(): CellData[] {
    const cells: CellData[] = [];

    // Helper to add booking for a specific day, time, and lanes
    const addBooking = (
      dayIndex: number,
      timeSlot: string,
      lanes: number[],
      color = COLORS.BLUE
    ) => {
      const rowIndex = timeToRowIndex(timeSlot);
      if (rowIndex < 0) return;

      const actualRow = SHEET_STRUCTURE.FIRST_TIME_ROW + rowIndex;
      const dayColStart = SHEET_STRUCTURE.DAY_COLUMN_OFFSETS[dayIndex];

      for (const lane of lanes) {
        cells.push({
          row: actualRow,
          col: dayColStart + lane - 1,
          backgroundColor: color,
        });
      }
    };

    // Monday 26.01.2026 (dayIndex=0)
    // 06:00 - All 6 lanes BOOKED
    addBooking(0, '06:00', [1, 2, 3, 4, 5, 6], COLORS.ORANGE);
    // 06:15 - All 6 lanes BOOKED
    addBooking(0, '06:15', [1, 2, 3, 4, 5, 6], COLORS.ORANGE);
    // 09:15 - 2 BOOKED (blue), 4 FREE (lanes 3, 4 booked based on visual)
    addBooking(0, '09:15', [3, 4], COLORS.BLUE);
    // 12:30 - 1 FREE, 5 BOOKED (lane 6 free based on visual)
    addBooking(0, '12:30', [1, 2, 3, 4, 5], COLORS.YELLOW);

    // Wednesday 28.01.2026 (dayIndex=2)
    // 09:00 - 3 FREE, 3 BOOKED (lanes 1, 2, 3 booked based on visual)
    addBooking(2, '09:00', [1, 2, 3], COLORS.BLUE);

    // Friday 30.01.2026 (dayIndex=4)
    // 07:00 - 3 FREE, 3 BOOKED (orange) (lanes 4, 5, 6 booked based on visual)
    addBooking(4, '07:00', [4, 5, 6], COLORS.ORANGE);
    // 11:00 - All 6 lanes FREE (no bookings needed)

    // Saturday 31.01.2026 (dayIndex=5)
    // 08:00 - All 6 lanes BOOKED (magenta block)
    addBooking(5, '08:00', [1, 2, 3, 4, 5, 6], COLORS.MAGENTA);
    // 13:30 - 2 BOOKED, 4 FREE (lanes 1, 2 booked based on visual)
    addBooking(5, '13:30', [1, 2], COLORS.BLUE);

    // Sunday 01.02.2026 (dayIndex=6)
    // 10:00 - All 6 lanes FREE (no bookings needed)

    return cells;
  }

  const weekStartDate = new Date('2026-01-26');
  const testCells = createTestCells();
  const schedule = parseCellData(testCells, weekStartDate);

  // Helper to create lane IDs map
  const createLaneIds = (): Map<number, string> => {
    const laneIds = new Map<number, string>();
    for (let i = 1; i <= 6; i++) {
      laneIds.set(i, `lane-${i}`);
    }
    return laneIds;
  };

  describe('Test Case 1: Monday 26.01.2026 @ 06:00', () => {
    it('should show all 6 lanes BOOKED', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '06:00', endTime: '06:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(0);
      expect(bookedLanes.length).toBe(6);
    });
  });

  describe('Test Case 2: Monday 26.01.2026 @ 06:15', () => {
    it('should show all 6 lanes BOOKED', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '06:15', endTime: '06:30' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(0);
      expect(bookedLanes.length).toBe(6);
    });
  });

  describe('Test Case 3: Monday 26.01.2026 @ 09:15', () => {
    it('should show 2 lanes BOOKED, 4 lanes FREE', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '09:15', endTime: '09:30' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(4);
      expect(bookedLanes.length).toBe(2);
    });
  });

  describe('Test Case 4: Monday 26.01.2026 @ 12:30', () => {
    it('should show 1 lane FREE, 5 lanes BOOKED', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '12:30', endTime: '12:45' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(1);
      expect(bookedLanes.length).toBe(5);
    });
  });

  describe('Test Case 5: Friday 30.01.2026 @ 07:00', () => {
    it('should show 3 lanes FREE, 3 lanes BOOKED', () => {
      const date = new Date('2026-01-30');
      const timeSlot: TimeSlot = { startTime: '07:00', endTime: '07:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(3);
      expect(bookedLanes.length).toBe(3);
    });
  });

  describe('Test Case 6: Friday 30.01.2026 @ 11:00', () => {
    it('should show all 6 lanes FREE', () => {
      const date = new Date('2026-01-30');
      const timeSlot: TimeSlot = { startTime: '11:00', endTime: '11:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(6);
      expect(bookedLanes.length).toBe(0);
    });
  });

  describe('Test Case 7: Saturday 31.01.2026 @ 08:00', () => {
    it('should show all 6 lanes BOOKED', () => {
      const date = new Date('2026-01-31');
      const timeSlot: TimeSlot = { startTime: '08:00', endTime: '08:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(0);
      expect(bookedLanes.length).toBe(6);
    });
  });

  describe('Test Case 8: Saturday 31.01.2026 @ 13:30', () => {
    it('should show 2 lanes BOOKED, 4 lanes FREE', () => {
      const date = new Date('2026-01-31');
      const timeSlot: TimeSlot = { startTime: '13:30', endTime: '13:45' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(4);
      expect(bookedLanes.length).toBe(2);
    });
  });

  describe('Test Case 9: Wednesday 28.01.2026 @ 09:00', () => {
    it('should show 3 lanes FREE, 3 lanes BOOKED', () => {
      const date = new Date('2026-01-28');
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '09:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(3);
      expect(bookedLanes.length).toBe(3);
    });
  });

  describe('Test Case 10: Sunday 01.02.2026 @ 10:00', () => {
    it('should show all 6 lanes FREE', () => {
      const date = new Date('2026-02-01');
      const timeSlot: TimeSlot = { startTime: '10:00', endTime: '10:15' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(6);
      expect(bookedLanes.length).toBe(0);
    });
  });
});

/**
 * 30-minute time slot aggregation tests
 * These tests verify that the parser correctly aggregates multiple 15-min slots
 * A lane is only FREE if ALL 15-min slots within the 30-min window are free
 */
describe('30-minute time slot aggregation', () => {
  /**
   * Create test cells fixture with specific 15-minute slot patterns
   * to test 30-minute aggregation logic
   */
  function createAggregationTestCells(): CellData[] {
    const cells: CellData[] = [];
    const BLUE = { red: 0.26, green: 0.52, blue: 0.96 };
    const ORANGE = { red: 1, green: 0.6, blue: 0 };

    const addBooking = (
      dayIndex: number,
      timeSlot: string,
      lanes: number[],
      color = BLUE
    ) => {
      const rowIndex = timeToRowIndex(timeSlot);
      if (rowIndex < 0) return;

      const actualRow = SHEET_STRUCTURE.FIRST_TIME_ROW + rowIndex;
      const dayColStart = SHEET_STRUCTURE.DAY_COLUMN_OFFSETS[dayIndex];

      for (const lane of lanes) {
        cells.push({
          row: actualRow,
          col: dayColStart + lane - 1,
          backgroundColor: color,
        });
      }
    };

    // Monday 26.01.2026 (dayIndex=0)
    // 12:30 slot: lanes 1-5 booked, lane 6 free
    addBooking(0, '12:30', [1, 2, 3, 4, 5]);
    // 12:45 slot: lanes 1-5 booked, lane 6 free (same pattern)
    addBooking(0, '12:45', [1, 2, 3, 4, 5]);

    // 15:30 slot: all 6 lanes booked
    addBooking(0, '15:30', [1, 2, 3, 4, 5, 6], ORANGE);
    // 15:45 slot: all 6 lanes booked
    addBooking(0, '15:45', [1, 2, 3, 4, 5, 6], ORANGE);

    // 16:30 slot: all 6 lanes booked
    addBooking(0, '16:30', [1, 2, 3, 4, 5, 6], ORANGE);
    // 16:45 slot: all 6 lanes booked
    addBooking(0, '16:45', [1, 2, 3, 4, 5, 6], ORANGE);

    return cells;
  }

  const weekStartDate = new Date('2026-01-26');
  const testCells = createAggregationTestCells();
  const schedule = parseCellData(testCells, weekStartDate);

  const createLaneIds = (): Map<number, string> => {
    const laneIds = new Map<number, string>();
    for (let i = 1; i <= 6; i++) {
      laneIds.set(i, `lane-${i}`);
    }
    return laneIds;
  };

  describe('Mon 26.01.2026 12:30 (30-min slot)', () => {
    it('should show 5 BOOKED, 1 FREE for 30-minute slot 12:30-13:00', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '12:30', endTime: '13:00' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(1);
      expect(bookedLanes.length).toBe(5);
    });
  });

  describe('Mon 26.01.2026 15:30 (30-min slot)', () => {
    it('should show 6 BOOKED, 0 FREE for 30-minute slot 15:30-16:00', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '15:30', endTime: '16:00' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(0);
      expect(bookedLanes.length).toBe(6);
    });
  });

  describe('Mon 26.01.2026 16:30 (30-min slot)', () => {
    it('should show 6 BOOKED, 0 FREE for 30-minute slot 16:30-17:00', () => {
      const date = new Date('2026-01-26');
      const timeSlot: TimeSlot = { startTime: '16:30', endTime: '17:00' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(schedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(6);

      const freeLanes = availability.filter((a) => a.isAvailable);
      const bookedLanes = availability.filter((a) => !a.isAvailable);

      expect(freeLanes.length).toBe(0);
      expect(bookedLanes.length).toBe(6);
    });
  });

  describe('Mixed 30-min slot (first 15-min free, second 15-min booked)', () => {
    /**
     * Create a scenario where first 15-min is free but second 15-min is booked
     * The whole 30-min slot should be marked as BOOKED
     */
    function createMixedTestCells(): CellData[] {
      const cells: CellData[] = [];
      const BLUE = { red: 0.26, green: 0.52, blue: 0.96 };

      const addBooking = (
        dayIndex: number,
        timeSlot: string,
        lanes: number[],
        color = BLUE
      ) => {
        const rowIndex = timeToRowIndex(timeSlot);
        if (rowIndex < 0) return;

        const actualRow = SHEET_STRUCTURE.FIRST_TIME_ROW + rowIndex;
        const dayColStart = SHEET_STRUCTURE.DAY_COLUMN_OFFSETS[dayIndex];

        for (const lane of lanes) {
          cells.push({
            row: actualRow,
            col: dayColStart + lane - 1,
            backgroundColor: color,
          });
        }
      };

      // Tuesday (dayIndex=1)
      // 10:00 slot: lane 1 free (no booking)
      // 10:15 slot: lane 1 booked
      addBooking(1, '10:15', [1]);

      return cells;
    }

    const mixedCells = createMixedTestCells();
    const mixedSchedule = parseCellData(mixedCells, weekStartDate);

    it('should mark lane as BOOKED if any 15-min slot in the range is booked', () => {
      const date = new Date('2026-01-27'); // Tuesday
      const timeSlot: TimeSlot = { startTime: '10:00', endTime: '10:30' };
      const laneIds = createLaneIds();

      const availability = filterSlotsForTimeSlot(mixedSchedule, date, timeSlot, laneIds);

      // Lane 1 should be booked because 10:15 is booked
      const lane1 = availability.find((a) => a.laneNumber === 1);
      expect(lane1?.isAvailable).toBe(false);

      // Lanes 2-6 should be free (no bookings)
      const otherLanes = availability.filter((a) => a.laneNumber > 1);
      expect(otherLanes.every((a) => a.isAvailable)).toBe(true);
    });
  });
});
