import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseScheduleTable } from '../../../src/scrapers/pools/teatralna-basen1/parser.js';
import type { ParsedScheduleDay } from '../../../src/scrapers/pools/teatralna-basen1/parser.js';

let parsedDays: ParsedScheduleDay[];

beforeAll(() => {
  const fixturePath = resolve(
    import.meta.dirname,
    'fixtures',
    'basen1-schedule.html'
  );
  const html = readFileSync(fixturePath, 'utf-8');
  parsedDays = parseScheduleTable(html);
});

describe('parseScheduleTable', () => {
  it('should parse 7 days from the schedule', () => {
    expect(parsedDays).toHaveLength(7);
  });

  it('should extract correct dates from column headers', () => {
    const dates = parsedDays.map((d) => d.date);
    expect(dates[0]).toBe('2026-02-09'); // poniedziałek
    expect(dates[1]).toBe('2026-02-10'); // wtorek
    expect(dates[6]).toBe('2026-02-15'); // niedziela
  });

  it('should extract day names', () => {
    expect(parsedDays[0].dayName).toContain('poniedzia');
    expect(parsedDays[1].dayName).toContain('wtorek');
  });

  it('should parse hourly time slots (06:00 through 21:00)', () => {
    // Tuesday (2026-02-10) should have full hours
    const tuesday = parsedDays[1];
    const hours = tuesday.slots.map((s) => s.hour);
    expect(hours).toContain('06:00');
    expect(hours).toContain('21:00');
  });

  it('should extract free spots from "Wolne miejsca: N" pattern', () => {
    // Tuesday 07:00 has "Wolne miejsca: 27"
    const tuesday = parsedDays[1];
    const slot0700 = tuesday.slots.find((s) => s.hour === '07:00');
    expect(slot0700).toBeDefined();
    expect(slot0700!.freeSpots).toBe(27);
  });

  it('should extract 30 free spots for full availability', () => {
    // Tuesday 09:00 has "Wolne miejsca: 30"
    const tuesday = parsedDays[1];
    const slot0900 = tuesday.slots.find((s) => s.hour === '09:00');
    expect(slot0900).toBeDefined();
    expect(slot0900!.freeSpots).toBe(30);
  });

  it('should handle reduced availability (18 spots)', () => {
    // Wednesday 18:00 has "Wolne miejsca: 18"
    const wednesday = parsedDays[2];
    const slot1800 = wednesday.slots.find((s) => s.hour === '18:00');
    expect(slot1800).toBeDefined();
    expect(slot1800!.freeSpots).toBe(18);
  });

  it('should handle reduced availability (12 spots)', () => {
    // Friday 15:00 has "Wolne miejsca: 12"
    const friday = parsedDays[4];
    const slot1500 = friday.slots.find((s) => s.hour === '15:00');
    expect(slot1500).toBeDefined();
    expect(slot1500!.freeSpots).toBe(12);
  });

  it('should mark inactive/past slots with isActive=false and 0 freeSpots', () => {
    // Monday (past day) should have inactive slots
    const monday = parsedDays[0];
    const slot0600 = monday.slots.find((s) => s.hour === '06:00');
    expect(slot0600).toBeDefined();
    expect(slot0600!.isActive).toBe(false);
    expect(slot0600!.freeSpots).toBe(0);
  });

  it('should handle empty cells (no session) with isActive=false', () => {
    // Monday has no 19:00 session (empty cell visible in the snapshot)
    const monday = parsedDays[0];
    const slot1900 = monday.slots.find((s) => s.hour === '19:00');
    if (slot1900) {
      expect(slot1900.isActive).toBe(false);
      expect(slot1900.freeSpots).toBe(0);
    }
  });

  it('should handle weekend empty cells', () => {
    // Saturday and Sunday may have empty cells at certain hours
    const saturday = parsedDays[5];
    const slot0600 = saturday.slots.find((s) => s.hour === '06:00');
    if (slot0600) {
      // Empty cells = no session = inactive
      expect(slot0600.freeSpots).toBe(0);
      expect(slot0600.isActive).toBe(false);
    }
  });
});
