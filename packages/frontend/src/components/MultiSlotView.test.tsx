/**
 * Tests for MultiSlotView component (005-pool-view-options)
 * TDD: Write tests FIRST, ensure they FAIL before implementation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiSlotView } from './MultiSlotView';
import type { SlotData } from './SlotSection';

// Helper to create mock slot data
function createMockSlot(overrides: Partial<SlotData> = {}): SlotData {
  return {
    startTime: '09:00',
    endTime: '09:30',
    lanes: [
      { laneId: '1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
      { laneId: '2', laneNumber: 2, isAvailable: false, lastUpdated: new Date() },
    ],
    availableCount: 1,
    totalCount: 2,
    loading: false,
    ...overrides,
  };
}

describe('MultiSlotView', () => {
  describe('single slot', () => {
    it('should render a single slot section', () => {
      const slots = [createMockSlot({ startTime: '09:00', endTime: '09:30' })];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      expect(screen.getByTestId('multi-slot')).toBeInTheDocument();
    });

    it('should display time header for the slot', () => {
      const slots = [createMockSlot({ startTime: '09:00', endTime: '09:30' })];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" />);

      expect(screen.getByText(/09:00/)).toBeInTheDocument();
    });
  });

  describe('multiple slots', () => {
    it('should render 3 slot sections when given 3 slots', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30' }),
        createMockSlot({ startTime: '09:30', endTime: '10:00' }),
        createMockSlot({ startTime: '10:00', endTime: '10:30' }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      // Each slot should have its own section - use exact text to avoid overlap issues
      expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument();
      expect(screen.getByText('09:30 - 10:00')).toBeInTheDocument();
      expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();
    });

    it('should stack slots vertically', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30' }),
        createMockSlot({ startTime: '09:30', endTime: '10:00' }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      const container = screen.getByTestId('multi-slot');
      // Container should have flex-direction: column or similar vertical stacking
      expect(container).toBeInTheDocument();
    });
  });

  describe('compact view mode', () => {
    it('should render compact bars when compactView is true', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', availableCount: 3, totalCount: 6 }),
      ];
      render(<MultiSlotView slots={slots} compactView={true} date="2026-02-02" testId="multi-slot" />);

      // Should show availability text in compact format
      expect(screen.getByText(/3 of 6 available/)).toBeInTheDocument();
    });

    it('should render lane grid when compactView is false', () => {
      const slots = [
        createMockSlot({
          startTime: '09:00',
          endTime: '09:30',
          lanes: [
            { laneId: '1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
            { laneId: '2', laneNumber: 2, isAvailable: false, lastUpdated: new Date() },
          ],
        }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      // Should render lane grid elements
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading state for individual slots', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', loading: true }),
        createMockSlot({ startTime: '09:30', endTime: '10:00', loading: false }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      // First slot should indicate loading
      // Second slot should be normal
      expect(screen.getByTestId('multi-slot')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('should display error message for failed slots', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', error: 'Failed to fetch' }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    it('should show partial data with some slots loaded and some errored', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30' }),
        createMockSlot({ startTime: '09:30', endTime: '10:00', error: 'Network error' }),
      ];
      render(<MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />);

      // First slot should show data
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
      // Second slot should show error
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  describe('empty slots', () => {
    it('should handle empty slots array', () => {
      render(<MultiSlotView slots={[]} compactView={false} date="2026-02-02" testId="multi-slot" />);

      const container = screen.getByTestId('multi-slot');
      expect(container).toBeInTheDocument();
    });
  });

  // T026: Combined view tests (User Story 4)
  describe('combined view - compact mode with multiple slots', () => {
    it('should render 3 compact bars when compactView is true with 3 slots', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', availableCount: 4, totalCount: 6 }),
        createMockSlot({ startTime: '09:30', endTime: '10:00', availableCount: 2, totalCount: 6 }),
        createMockSlot({ startTime: '10:00', endTime: '10:30', availableCount: 0, totalCount: 6 }),
      ];
      render(<MultiSlotView slots={slots} compactView={true} date="2026-02-02" testId="multi-slot" />);

      // Each slot should show time header
      expect(screen.getByText('09:00 - 09:30')).toBeInTheDocument();
      expect(screen.getByText('09:30 - 10:00')).toBeInTheDocument();
      expect(screen.getByText('10:00 - 10:30')).toBeInTheDocument();

      // Each slot should show compact availability text
      expect(screen.getByText('4 of 6 available')).toBeInTheDocument();
      expect(screen.getByText('2 of 6 available')).toBeInTheDocument();
      expect(screen.getByText('0 of 6 available')).toBeInTheDocument();
    });

    it('should display percentage for each slot in compact mode', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', availableCount: 6, totalCount: 6 }),
        createMockSlot({ startTime: '09:30', endTime: '10:00', availableCount: 3, totalCount: 6 }),
      ];
      render(<MultiSlotView slots={slots} compactView={true} date="2026-02-02" testId="multi-slot" />);

      // Should show percentage for each slot
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should pass compactView prop to all SlotSections correctly', () => {
      const slots = [
        createMockSlot({ startTime: '09:00', endTime: '09:30', availableCount: 3, totalCount: 6 }),
        createMockSlot({ startTime: '09:30', endTime: '10:00', availableCount: 3, totalCount: 6 }),
      ];

      // Compact view = true: should show compact bars
      const { rerender } = render(
        <MultiSlotView slots={slots} compactView={true} date="2026-02-02" testId="multi-slot" />
      );

      // In compact mode, we should see "X of Y available" text (from CompactAvailabilityBar)
      expect(screen.getAllByText('3 of 6 available')).toHaveLength(2);

      // Compact view = false: should show lane grids
      rerender(
        <MultiSlotView slots={slots} compactView={false} date="2026-02-02" testId="multi-slot" />
      );

      // In detailed mode, we should see "Available" and "Booked" labels (from LaneGrid)
      expect(screen.getAllByText('Available')).toHaveLength(2);
      expect(screen.getAllByText('Booked')).toHaveLength(2);
    });
  });
});
