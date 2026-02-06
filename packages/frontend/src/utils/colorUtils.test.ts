/**
 * Tests for color utilities (005-pool-view-options)
 */

import { describe, it, expect } from 'vitest';
import { calculateAvailabilityColor, AVAILABILITY_COLOR_STOPS } from './colorUtils';

describe('calculateAvailabilityColor', () => {
  describe('color stops verification', () => {
    it('should have 4 color stops defined', () => {
      expect(AVAILABILITY_COLOR_STOPS).toHaveLength(4);
    });

    it('should have stops at 0%, 20%, 50%, and 100%', () => {
      const percentages = AVAILABILITY_COLOR_STOPS.map(stop => stop.percentage);
      expect(percentages).toEqual([0, 0.2, 0.5, 1]);
    });
  });

  describe('boundary values', () => {
    it('should return dark gray/black at 0% availability', () => {
      const color = calculateAvailabilityColor(0);
      // At 0%, color should be hsl(0, 0%, 25%) - dark gray
      expect(color.background).toBe('hsl(0, 0%, 25%)');
      expect(color.text).toBe('#ffffff'); // White text on dark background
    });

    it('should return green at 100% availability', () => {
      const color = calculateAvailabilityColor(1);
      // At 100%, color should be hsl(120, 65%, 40%) - green
      expect(color.background).toBe('hsl(120, 65%, 40%)');
      expect(color.text).toBe('#ffffff'); // White text on dark background
    });

    it('should return red at 20% availability', () => {
      const color = calculateAvailabilityColor(0.2);
      // At 20%, color should be hsl(0, 70%, 50%) - red
      expect(color.background).toBe('hsl(0, 70%, 50%)');
    });

    it('should return amber at 50% availability', () => {
      const color = calculateAvailabilityColor(0.5);
      // At 50%, color should be hsl(45, 85%, 50%) - amber
      expect(color.background).toBe('hsl(45, 85%, 50%)');
    });
  });

  describe('interpolation', () => {
    it('should interpolate between 0% and 20% (dark to red)', () => {
      const color = calculateAvailabilityColor(0.1);
      // At 10%, should be halfway between dark gray and red
      // Interpolated hue should be 0 (both endpoints are 0)
      // Saturation should be interpolated between 0 and 70 (halfway = 35)
      // Lightness should be interpolated between 25 and 50 (halfway = 37.5)
      expect(color.background).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
      // The color should be darker than red but not as dark as black
    });

    it('should interpolate between 20% and 50% (red to amber)', () => {
      const color = calculateAvailabilityColor(0.35);
      // At 35%, should be halfway between red and amber
      // Hue: 0 -> 45, halfway = 22.5
      expect(color.background).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should interpolate between 50% and 100% (amber to green)', () => {
      const color = calculateAvailabilityColor(0.75);
      // At 75%, should be halfway between amber and green
      // Hue: 45 -> 120, halfway = 82.5
      expect(color.background).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });
  });

  describe('edge cases', () => {
    it('should clamp negative values to 0', () => {
      const color = calculateAvailabilityColor(-0.5);
      const zeroColor = calculateAvailabilityColor(0);
      expect(color.background).toBe(zeroColor.background);
    });

    it('should clamp values above 1 to 1', () => {
      const color = calculateAvailabilityColor(1.5);
      const maxColor = calculateAvailabilityColor(1);
      expect(color.background).toBe(maxColor.background);
    });

    it('should handle fractional percentages', () => {
      const color = calculateAvailabilityColor(0.333);
      expect(color.background).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });
  });

  describe('text contrast', () => {
    it('should return white text for dark backgrounds (0%)', () => {
      const color = calculateAvailabilityColor(0);
      expect(color.text).toBe('#ffffff');
    });

    it('should return white text for green (100%)', () => {
      const color = calculateAvailabilityColor(1);
      // Green at 40% lightness is dark, so white text
      expect(color.text).toBe('#ffffff');
    });

    it('should return dark text for amber (50%)', () => {
      const color = calculateAvailabilityColor(0.5);
      // Amber at 50% lightness, so dark text
      expect(color.text).toBe('#1a1a1a');
    });

    it('should return dark text for bright colors', () => {
      const color = calculateAvailabilityColor(0.5);
      // At 50% lightness, text should be dark
      expect(color.text).toBe('#1a1a1a');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle 1 of 6 lanes available (17%)', () => {
      const color = calculateAvailabilityColor(1 / 6);
      // ~17% is slightly below 20%, so should be between dark and red
      expect(color.background).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should handle 3 of 6 lanes available (50%)', () => {
      const color = calculateAvailabilityColor(3 / 6);
      // 50% should be amber
      expect(color.background).toBe('hsl(45, 85%, 50%)');
    });

    it('should handle 6 of 6 lanes available (100%)', () => {
      const color = calculateAvailabilityColor(6 / 6);
      // 100% should be green
      expect(color.background).toBe('hsl(120, 65%, 40%)');
    });

    it('should handle 0 of 6 lanes available (0%)', () => {
      const color = calculateAvailabilityColor(0 / 6);
      // 0% should be dark gray
      expect(color.background).toBe('hsl(0, 0%, 25%)');
    });
  });
});
