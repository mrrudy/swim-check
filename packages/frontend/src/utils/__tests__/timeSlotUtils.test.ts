/**
 * Unit tests for timeSlotUtils (011-smart-slot-selection)
 * T020: Verify generateForwardSlots respects day boundary
 * T021: Verify forward slots work after cross-day navigation
 */

import { describe, it, expect } from 'vitest';
import {
  generateForwardSlots,
  isOutsideOperatingHours,
  getNextDay,
  getPreviousDay,
  getLastAvailableStartTime,
} from '../timeSlotUtils';

describe('generateForwardSlots - day boundary clamping (US3)', () => {
  it('should return only 2 slots when starting at 20:00 with 60min duration and count=5', () => {
    const slots = generateForwardSlots('20:00', 60, 5);
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ startTime: '20:00', endTime: '21:00' });
    expect(slots[1]).toEqual({ startTime: '21:00', endTime: '22:00' });
  });

  it('should return 3 slots when starting at 14:00 with 60min duration and count=3', () => {
    const slots = generateForwardSlots('14:00', 60, 3);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ startTime: '14:00', endTime: '15:00' });
    expect(slots[1]).toEqual({ startTime: '15:00', endTime: '16:00' });
    expect(slots[2]).toEqual({ startTime: '16:00', endTime: '17:00' });
  });

  it('should return 1 slot when starting at 21:30 with 30min duration and count=5', () => {
    const slots = generateForwardSlots('21:30', 30, 5);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ startTime: '21:30', endTime: '22:00' });
  });

  it('should return 0 slots when starting at 22:00 (at closing time)', () => {
    const slots = generateForwardSlots('22:00', 60, 5);
    expect(slots).toHaveLength(0);
  });
});

describe('generateForwardSlots - after cross-day navigation (US3/T021)', () => {
  it('should generate correct slots for first slot of new day (05:00)', () => {
    // After cross-day navigation, user lands at 05:00
    const slots = generateForwardSlots('05:00', 60, 3);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ startTime: '05:00', endTime: '06:00' });
    expect(slots[1]).toEqual({ startTime: '06:00', endTime: '07:00' });
    expect(slots[2]).toEqual({ startTime: '07:00', endTime: '08:00' });
  });
});

describe('Operating hours helpers', () => {
  it('isOutsideOperatingHours returns true for times >= 22:00', () => {
    expect(isOutsideOperatingHours('22:00')).toBe(true);
    expect(isOutsideOperatingHours('23:30')).toBe(true);
  });

  it('isOutsideOperatingHours returns true for times < 05:00', () => {
    expect(isOutsideOperatingHours('04:59')).toBe(true);
    expect(isOutsideOperatingHours('00:00')).toBe(true);
    expect(isOutsideOperatingHours('03:00')).toBe(true);
  });

  it('isOutsideOperatingHours returns false for times within hours', () => {
    expect(isOutsideOperatingHours('05:00')).toBe(false);
    expect(isOutsideOperatingHours('14:00')).toBe(false);
    expect(isOutsideOperatingHours('21:30')).toBe(false);
  });

  it('getNextDay returns the next calendar day', () => {
    expect(getNextDay('2026-02-11')).toBe('2026-02-12');
    expect(getNextDay('2026-02-28')).toBe('2026-03-01');
    expect(getNextDay('2026-12-31')).toBe('2027-01-01');
  });

  it('getPreviousDay returns the previous calendar day', () => {
    expect(getPreviousDay('2026-02-12')).toBe('2026-02-11');
    expect(getPreviousDay('2026-03-01')).toBe('2026-02-28');
    expect(getPreviousDay('2027-01-01')).toBe('2026-12-31');
  });

  it('getLastAvailableStartTime returns correct time for various durations', () => {
    expect(getLastAvailableStartTime(60)).toBe('21:00');
    expect(getLastAvailableStartTime(30)).toBe('21:30');
    expect(getLastAvailableStartTime(120)).toBe('20:00');
    expect(getLastAvailableStartTime(480)).toBe('14:00'); // 8 hours
  });
});
