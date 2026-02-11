/**
 * Unit tests for getDefaultTimeSlotFallback (011-smart-slot-selection)
 * T006: Test frontend fallback outside-hours scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDefaultTimeSlotFallback } from '../useTimeSlotState';

describe('getDefaultTimeSlotFallback - outside operating hours', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return next day + 05:00 when current time is 22:15 (evening)', () => {
    vi.setSystemTime(new Date('2026-02-11T22:15:00'));
    const result = getDefaultTimeSlotFallback();
    expect(result.time).toBe('05:00');
    expect(result.date).toBe('2026-02-12');
  });

  it('should return today + 05:00 when current time is 03:00 (early morning)', () => {
    vi.setSystemTime(new Date('2026-02-11T03:00:00'));
    const result = getDefaultTimeSlotFallback();
    expect(result.time).toBe('05:00');
    expect(result.date).toBe('2026-02-11');
  });

  it('should return today + 05:30 when current time is 04:45 (within hours after rounding)', () => {
    // 04:45 → round up to 05:00 + 30 = 05:30 → within operating hours
    vi.setSystemTime(new Date('2026-02-11T04:45:00'));
    const result = getDefaultTimeSlotFallback();
    expect(result.time).toBe('05:30');
    expect(result.date).toBe('2026-02-11');
  });

  it('should return normal time when at 14:00 (within hours)', () => {
    vi.setSystemTime(new Date('2026-02-11T14:00:00'));
    const result = getDefaultTimeSlotFallback();
    // Frontend fallback: round up to 14:30 + 30 = 15:00
    expect(result.time).toBe('15:00');
    expect(result.date).toBe('2026-02-11');
  });

  it('should return next day + 05:00 at exactly 22:00', () => {
    vi.setSystemTime(new Date('2026-02-11T22:00:00'));
    const result = getDefaultTimeSlotFallback();
    expect(result.time).toBe('05:00');
    expect(result.date).toBe('2026-02-12');
  });
});
