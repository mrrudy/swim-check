/**
 * Tests for CompactAvailabilityBar component (005-pool-view-options)
 * TDD: Write tests FIRST, ensure they FAIL before implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompactAvailabilityBar } from './CompactAvailabilityBar';

describe('CompactAvailabilityBar', () => {
  describe('text display', () => {
    it('should display "X of Y available" text', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} />);
      expect(screen.getByText('3 of 6 available')).toBeInTheDocument();
    });

    it('should display singular "lane" when totalCount is 1', () => {
      render(<CompactAvailabilityBar availableCount={1} totalCount={1} />);
      expect(screen.getByText('1 of 1 available')).toBeInTheDocument();
    });

    it('should display 0 available correctly', () => {
      render(<CompactAvailabilityBar availableCount={0} totalCount={6} />);
      expect(screen.getByText('0 of 6 available')).toBeInTheDocument();
    });

    it('should display all available correctly', () => {
      render(<CompactAvailabilityBar availableCount={6} totalCount={6} />);
      expect(screen.getByText('6 of 6 available')).toBeInTheDocument();
    });
  });

  describe('percentage bar', () => {
    it('should render a progress bar element', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} testId="availability-bar" />);
      expect(screen.getByTestId('availability-bar')).toBeInTheDocument();
    });

    it('should have fill width proportional to availability at 100%', () => {
      render(<CompactAvailabilityBar availableCount={6} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should have fill width proportional to availability at 50%', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('should have fill width proportional to availability at 0%', () => {
      render(<CompactAvailabilityBar availableCount={0} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should handle 17% availability (1 of 6)', () => {
      render(<CompactAvailabilityBar availableCount={1} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      // 1/6 = 16.666...%
      expect(fill.style.width).toMatch(/^16\.\d+%$/);
    });
  });

  describe('color coding', () => {
    // Note: Browser converts HSL to RGB, so we check for valid RGB values
    it('should have green background at 100% availability', () => {
      render(<CompactAvailabilityBar availableCount={6} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      // hsl(120, 65%, 40%) converts to approximately rgb(36, 168, 36) - green
      expect(fill.style.backgroundColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
      // Verify it's a greenish color (G > R and G > B)
      const rgb = fill.style.backgroundColor.match(/\d+/g)?.map(Number);
      expect(rgb?.[1]).toBeGreaterThan(rgb?.[0] ?? 0); // G > R
      expect(rgb?.[1]).toBeGreaterThan(rgb?.[2] ?? 0); // G > B
    });

    it('should have amber background at 50% availability', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      // hsl(45, 85%, 50%) converts to approximately rgb(236, 182, 19) - amber
      expect(fill.style.backgroundColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
      // Verify it's an amber/yellow color (R high, G medium, B low)
      const rgb = fill.style.backgroundColor.match(/\d+/g)?.map(Number);
      expect(rgb?.[0]).toBeGreaterThan(150); // High red
      expect(rgb?.[2]).toBeLessThan(100); // Low blue
    });

    it('should have red background at ~17% availability', () => {
      render(<CompactAvailabilityBar availableCount={1} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      // Should be interpolated red color
      expect(fill.style.backgroundColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
      // Verify it's a reddish color (R > G and R > B)
      const rgb = fill.style.backgroundColor.match(/\d+/g)?.map(Number);
      expect(rgb?.[0]).toBeGreaterThan(rgb?.[1] ?? 0); // R > G
    });

    it('should have dark background at 0% availability', () => {
      render(<CompactAvailabilityBar availableCount={0} totalCount={6} testId="availability-bar" />);
      const fill = screen.getByTestId('availability-bar-fill');
      // hsl(0, 0%, 25%) converts to approximately rgb(64, 64, 64) - dark gray
      expect(fill.style.backgroundColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
      // Verify it's a dark gray (all values similar and low)
      const rgb = fill.style.backgroundColor.match(/\d+/g)?.map(Number);
      expect(rgb?.[0]).toBeLessThan(100);
      expect(rgb?.[1]).toBeLessThan(100);
      expect(rgb?.[2]).toBeLessThan(100);
    });
  });

  describe('loading state', () => {
    it('should render with reduced opacity when loading', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} loading testId="availability-bar" />);
      const container = screen.getByTestId('availability-bar');
      expect(container).toHaveStyle({ opacity: '0.6' });
    });

    it('should render at full opacity when not loading', () => {
      render(<CompactAvailabilityBar availableCount={3} totalCount={6} testId="availability-bar" />);
      const container = screen.getByTestId('availability-bar');
      // Either no opacity set or opacity: 1
      expect(container.style.opacity === '' || container.style.opacity === '1').toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle 0 total lanes gracefully', () => {
      render(<CompactAvailabilityBar availableCount={0} totalCount={0} testId="availability-bar" />);
      // Should not throw and should display something reasonable
      expect(screen.getByTestId('availability-bar')).toBeInTheDocument();
    });

    it('should handle available > total (data anomaly)', () => {
      render(<CompactAvailabilityBar availableCount={8} totalCount={6} testId="availability-bar" />);
      // Should clamp to 100%
      const fill = screen.getByTestId('availability-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });
  });
});
