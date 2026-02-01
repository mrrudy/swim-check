import { describe, it, expect } from 'vitest';
import {
  generateTimeOptions,
  TIME_OPTIONS,
  getSlotIndex,
  getTimeFromIndex,
  calculateEndTime,
  calculateDuration,
  canExtendDuration,
  canReduceDuration,
} from './timeSlotUtils';

describe('timeSlotUtils', () => {
  describe('generateTimeOptions', () => {
    it('should generate 35 time options', () => {
      const options = generateTimeOptions();
      expect(options).toHaveLength(35);
    });

    it('should start at 05:00', () => {
      const options = generateTimeOptions();
      expect(options[0]).toBe('05:00');
    });

    it('should end at 22:00', () => {
      const options = generateTimeOptions();
      expect(options[options.length - 1]).toBe('22:00');
    });

    it('should have 30-minute intervals', () => {
      const options = generateTimeOptions();
      expect(options[0]).toBe('05:00');
      expect(options[1]).toBe('05:30');
      expect(options[2]).toBe('06:00');
    });
  });

  describe('TIME_OPTIONS constant', () => {
    it('should be pre-generated with correct length', () => {
      expect(TIME_OPTIONS).toHaveLength(35);
    });
  });

  describe('getSlotIndex', () => {
    it('should return 0 for first slot (05:00)', () => {
      expect(getSlotIndex('05:00')).toBe(0);
    });

    it('should return 34 for last slot (22:00)', () => {
      expect(getSlotIndex('22:00')).toBe(34);
    });

    it('should return correct index for middle slots', () => {
      expect(getSlotIndex('10:00')).toBe(10); // (10-5)*2 = 10
      expect(getSlotIndex('10:30')).toBe(11);
      expect(getSlotIndex('14:00')).toBe(18); // (14-5)*2 = 18
    });

    it('should return -1 for invalid time', () => {
      expect(getSlotIndex('04:00')).toBe(-1);
      expect(getSlotIndex('23:00')).toBe(-1);
      expect(getSlotIndex('invalid')).toBe(-1);
    });
  });

  describe('getTimeFromIndex', () => {
    it('should return first slot for index 0', () => {
      expect(getTimeFromIndex(0)).toBe('05:00');
    });

    it('should return last slot for index 34', () => {
      expect(getTimeFromIndex(34)).toBe('22:00');
    });

    it('should clamp negative indices to 0', () => {
      expect(getTimeFromIndex(-1)).toBe('05:00');
      expect(getTimeFromIndex(-100)).toBe('05:00');
    });

    it('should clamp indices above 34 to 34', () => {
      expect(getTimeFromIndex(35)).toBe('22:00');
      expect(getTimeFromIndex(100)).toBe('22:00');
    });

    it('should return correct time for middle indices', () => {
      expect(getTimeFromIndex(10)).toBe('10:00');
      expect(getTimeFromIndex(11)).toBe('10:30');
    });
  });

  describe('calculateEndTime', () => {
    it('should calculate end time for 60-minute duration', () => {
      expect(calculateEndTime('10:00', 60)).toBe('11:00');
    });

    it('should calculate end time for 30-minute duration', () => {
      expect(calculateEndTime('10:00', 30)).toBe('10:30');
    });

    it('should calculate end time for 90-minute duration', () => {
      expect(calculateEndTime('10:00', 90)).toBe('11:30');
    });

    it('should clamp to pool closing time (22:00)', () => {
      expect(calculateEndTime('21:00', 120)).toBe('22:00');
      expect(calculateEndTime('21:30', 60)).toBe('22:00');
    });

    it('should handle early morning slots', () => {
      expect(calculateEndTime('05:00', 60)).toBe('06:00');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate 60 minutes for 1-hour difference', () => {
      expect(calculateDuration('10:00', '11:00')).toBe(60);
    });

    it('should calculate 30 minutes correctly', () => {
      expect(calculateDuration('10:00', '10:30')).toBe(30);
    });

    it('should calculate 90 minutes correctly', () => {
      expect(calculateDuration('10:00', '11:30')).toBe(90);
    });

    it('should calculate full day duration', () => {
      expect(calculateDuration('05:00', '22:00')).toBe(17 * 60); // 1020 minutes
    });
  });

  describe('canExtendDuration', () => {
    it('should return true when extension is possible', () => {
      expect(canExtendDuration('10:00', 60)).toBe(true);
      expect(canExtendDuration('10:00', 30)).toBe(true);
    });

    it('should return false when at pool closing boundary', () => {
      // Starting at 21:30 with 30 min duration = end at 22:00
      // Cannot extend because 21:30 + 60 = 22:30 > 22:00
      expect(canExtendDuration('21:30', 30)).toBe(false);
    });

    it('should return true when exactly 30 mins can be added before closing', () => {
      // Starting at 21:00 with 30 min duration = end at 21:30
      // Can extend to 22:00
      expect(canExtendDuration('21:00', 30)).toBe(true);
    });
  });

  describe('canReduceDuration', () => {
    it('should return true when duration is above minimum', () => {
      expect(canReduceDuration(60)).toBe(true);
      expect(canReduceDuration(90)).toBe(true);
      expect(canReduceDuration(480)).toBe(true);
    });

    it('should return false when duration is at minimum (30)', () => {
      expect(canReduceDuration(30)).toBe(false);
    });

    it('should return false when duration is below minimum', () => {
      expect(canReduceDuration(15)).toBe(false);
      expect(canReduceDuration(0)).toBe(false);
    });
  });
});
