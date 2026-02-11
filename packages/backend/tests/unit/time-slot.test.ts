/**
 * Unit tests for calculateDefaultStartTime (011-smart-slot-selection)
 * T005: Test outside-hours scenarios for operating-hours clamping
 */

import { describe, it, expect } from 'vitest';
import { calculateDefaultStartTime } from '../../src/services/time-slot.js';

describe('calculateDefaultStartTime', () => {
  describe('outside operating hours - evening (>= 22:00)', () => {
    it('should return next day + 05:00 when time is 22:15', () => {
      // 22:15 + 30min = 22:45 → rounded = 22:30 → >= 22:00 → next day 05:00
      const now = new Date('2026-02-11T22:15:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-12', time: '05:00' });
    });

    it('should return next day + 05:00 at exactly 22:00', () => {
      // 22:00 + 30min = 22:30 → rounded = 22:30 → >= 22:00 → next day 05:00
      const now = new Date('2026-02-11T22:00:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-12', time: '05:00' });
    });

    it('should return next day + 05:00 at 23:45', () => {
      // 23:45 + 30min = 00:15 next day → rounded = 00:00 → < 05:00 → same day 05:00
      // But since the Date crosses midnight, date is already 2026-02-12
      const now = new Date('2026-02-11T23:45:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-12', time: '05:00' });
    });
  });

  describe('outside operating hours - early morning (< 05:00)', () => {
    it('should return today + 05:00 when time is 03:00', () => {
      // 03:00 + 30min = 03:30 → rounded = 03:30 → < 05:00 → today 05:00
      const now = new Date('2026-02-11T03:00:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-11', time: '05:00' });
    });

    it('should return today + 05:00 when time is 04:45', () => {
      // 04:45 + 30min = 05:15 → rounded = 05:00 → within hours → no change
      const now = new Date('2026-02-11T04:45:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-11', time: '05:00' });
    });
  });

  describe('within operating hours - no change', () => {
    it('should return today + rounded time when time is 14:00', () => {
      // 14:00 + 30min = 14:30 → rounded = 14:30 → within hours → no change
      const now = new Date('2026-02-11T14:00:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-11', time: '14:30' });
    });

    it('should return today + rounded time when time is 10:15', () => {
      // 10:15 + 30min = 10:45 → rounded = 10:30 → within hours → no change
      const now = new Date('2026-02-11T10:15:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-11', time: '10:30' });
    });
  });

  describe('edge cases at 21:30 boundary', () => {
    it('should return next day + 05:00 when time is 21:30', () => {
      // 21:30 + 30min = 22:00 → rounded = 22:00 → >= 22:00 → next day 05:00
      const now = new Date('2026-02-11T21:30:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-12', time: '05:00' });
    });

    it('should return today when time is 21:15', () => {
      // 21:15 + 30min = 21:45 → rounded = 21:30 → within hours
      const now = new Date('2026-02-11T21:15:00');
      const result = calculateDefaultStartTime(now);
      expect(result).toEqual({ date: '2026-02-11', time: '21:30' });
    });
  });
});
