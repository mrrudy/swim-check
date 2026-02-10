/**
 * Tests for Aquapark Wrocław Brochów PDF parser (reuses Borowska parser)
 * Using cached PDF: BRO.Grafik rezerwacji Basenu Rekreacyjnego_31.01-15.02.2026.pdf
 *
 * The PDF is a winter break (ferie zimowe) schedule for 31.01-15.02.2026.
 * Basen Rekreacyjny has 7 lanes.
 *
 * Test cases verify that the Borowska parser works correctly with Brochów PDFs:
 * 1. PDF parses 7 days with correct structure
 * 2. Lane data contains lanes 1-7 with booking information
 * 3. Time slot filtering works for the recreation pool schedule
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parsePdfBuffer, filterSlotsForTimeSlot, type ParsedSchedule } from '../aquapark-wroclaw-borowska/parser.js';
import type { TimeSlot } from '@swim-check/shared';

describe('Aquapark Wrocław Brochów PDF Parser', () => {
  let parsedSchedule: ParsedSchedule;

  beforeAll(async () => {
    const pdfPath = resolve(__dirname, '../../../../../../.cache/BRO.Grafik rezerwacji Basenu Rekreacyjnego_31.01-15.02.2026.pdf');
    const pdfBuffer = readFileSync(pdfPath);

    parsedSchedule = await parsePdfBuffer(pdfBuffer);
  });

  describe('PDF parsing', () => {
    it('should parse 7 days from the PDF', () => {
      expect(parsedSchedule.days.length).toBe(7);
    });

    it('should extract time slots per day', () => {
      for (const day of parsedSchedule.days) {
        expect(day.timeSlots.length).toBeGreaterThan(20);
      }
    });

    it('should have lane data for lanes 1-7', () => {
      for (const day of parsedSchedule.days) {
        // Parser outputs 8 lanes, but lane 8 should have no bookings (doesn't exist)
        const lanesWithBookings = day.lanes.filter(
          l => l.laneNumber <= 7 && l.availability.some(a => a)
        );
        expect(lanesWithBookings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Lane availability filtering (7 lanes)', () => {
    it('should return only 7 lanes when laneIds has 7 entries', () => {
      const date = new Date('2026-02-02'); // Monday
      const timeSlot: TimeSlot = { startTime: '10:00', endTime: '10:30' };

      const laneIds = new Map<number, string>();
      for (let i = 1; i <= 7; i++) {
        laneIds.set(i, `lane-${i}`);
      }

      const availability = filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);

      expect(availability.length).toBe(7);
      expect(availability.every(a => a.laneNumber >= 1 && a.laneNumber <= 7)).toBe(true);
    });

    it('should show some lanes as booked on Thursday morning (lanes 6, 7)', () => {
      // Thursday (day index 3) has different bookings in this winter break schedule
      const date = new Date('2026-02-05'); // Thursday
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '09:30' };

      const laneIds = new Map<number, string>();
      for (let i = 1; i <= 7; i++) {
        laneIds.set(i, `lane-${i}`);
      }

      const availability = filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);
      const bookedLanes = availability.filter(a => !a.isAvailable);

      expect(bookedLanes.length).toBe(2);
      const bookedLaneNumbers = bookedLanes.map(l => l.laneNumber).sort();
      expect(bookedLaneNumbers).toEqual([6, 7]);
    });
  });
});
