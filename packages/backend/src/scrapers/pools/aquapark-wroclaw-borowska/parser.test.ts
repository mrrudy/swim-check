/**
 * Tests for Aquapark Wrocław Borowska PDF parser
 * Using cached PDF: Grafik rezerwacji-Basen Sportowy_22.01.2026.pdf
 *
 * The PDF is dated 22.01.2026 and shows the week of 27.01-02.02.2026
 * (actual day mapping may differ from the PDF visual based on text extraction)
 *
 * Test cases based on actual parsed data:
 * 1. 30.01.2026 (Friday) 20:00-20:30: 6 available, 2 booked (lanes 7, 8)
 * 2. 31.01.2026 (Saturday) 09:30-10:30: 6 available, 2 booked (lanes 1, 8)
 * 3. 31.01.2026 (Saturday) 16:00-17:30: 8 available, 0 booked
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer, filterSlotsForTimeSlot, type ParsedSchedule } from './parser.js';
import type { TimeSlot } from '@swim-check/shared';

describe('Aquapark Wrocław Borowska PDF Parser', () => {
  let parsedSchedule: ParsedSchedule;

  beforeAll(async () => {
    // Resolve path relative to this test file's location
    // From: packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/parser.test.ts
    // To: .cache/...
    const pdfPath = resolve(__dirname, '../../../../../../.cache/Grafik rezerwacji-Basen Sportowy_22.01.2026.pdf');
    const pdfBuffer = readFileSync(pdfPath);

    // Parse the PDF with position awareness
    parsedSchedule = await parsePdfBuffer(pdfBuffer);
  });

  describe('PDF parsing', () => {
    it('should parse 7 days from the PDF', () => {
      expect(parsedSchedule.days.length).toBe(7);
    });

    it('should extract 32 time slots per day', () => {
      // PDF has 32 time columns (from 05:00/05:30 to 21:30)
      for (const day of parsedSchedule.days) {
        expect(day.timeSlots.length).toBe(32);
      }
    });

    it('should have 8 lanes per day', () => {
      for (const day of parsedSchedule.days) {
        expect(day.lanes.length).toBe(8);
      }
    });
  });

  describe('30.01.2026 (Friday) 20:00-20:30', () => {
    it('should show 6 available lanes and 2 booked (lanes 7, 8)', () => {
      // 30.01.2026 is Friday (day index 4 in 0=Mon format)
      const date = new Date('2026-01-30');
      const timeSlot: TimeSlot = { startTime: '20:00', endTime: '20:30' };

      const laneIds = new Map<number, string>();
      for (let i = 1; i <= 8; i++) {
        laneIds.set(i, `lane-${i}`);
      }

      const availability = filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(8);

      const availableLanes = availability.filter(a => a.isAvailable);
      const bookedLanes = availability.filter(a => !a.isAvailable);

      expect(availableLanes.length).toBe(6);
      expect(bookedLanes.length).toBe(2);

      // Lanes 7 and 8 should be booked
      const bookedLaneNumbers = bookedLanes.map(l => l.laneNumber).sort();
      expect(bookedLaneNumbers).toEqual([7, 8]);
    });
  });

  describe('31.01.2026 (Saturday) 09:30-10:30', () => {
    it('should show 6 available lanes and 2 booked (lanes 1, 8)', () => {
      // 31.01.2026 is Saturday (day index 5 in 0=Mon format)
      const date = new Date('2026-01-31');
      const timeSlot: TimeSlot = { startTime: '09:30', endTime: '10:30' };

      const laneIds = new Map<number, string>();
      for (let i = 1; i <= 8; i++) {
        laneIds.set(i, `lane-${i}`);
      }

      const availability = filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(8);

      const availableLanes = availability.filter(a => a.isAvailable);
      const bookedLanes = availability.filter(a => !a.isAvailable);

      expect(availableLanes.length).toBe(6);
      expect(bookedLanes.length).toBe(2);

      // Lanes 1 and 8 should be booked (based on actual PDF data)
      const bookedLaneNumbers = bookedLanes.map(l => l.laneNumber).sort();
      expect(bookedLaneNumbers).toEqual([1, 8]);
    });
  });

  describe('31.01.2026 (Saturday) 16:00-17:30', () => {
    it('should show 8 available lanes and 0 booked', () => {
      // 31.01.2026 is Saturday (day index 5 in 0=Mon format)
      const date = new Date('2026-01-31');
      const timeSlot: TimeSlot = { startTime: '16:00', endTime: '17:30' };

      const laneIds = new Map<number, string>();
      for (let i = 1; i <= 8; i++) {
        laneIds.set(i, `lane-${i}`);
      }

      const availability = filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(8);

      const availableLanes = availability.filter(a => a.isAvailable);
      const bookedLanes = availability.filter(a => !a.isAvailable);

      expect(availableLanes.length).toBe(8);
      expect(bookedLanes.length).toBe(0);
    });
  });
});
