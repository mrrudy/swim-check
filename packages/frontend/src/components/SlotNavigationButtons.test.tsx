import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlotNavigationButtons } from './SlotNavigationButtons';

describe('SlotNavigationButtons', () => {
  const defaultProps = {
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    canNavigatePrevious: true,
    canNavigateNext: true,
    canExtend: true,
    canReduce: true,
    onNavigatePrevious: vi.fn(),
    onNavigateNext: vi.fn(),
    onExtend: vi.fn(),
    onReduce: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // User Story 1: Navigation Buttons (T012-T013)
  // ==========================================

  describe('US1: navigation buttons', () => {
    // T012: renders Previous/Next buttons
    it('should render Previous button', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
    });

    it('should render Next button', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    // T013: disables buttons at boundaries
    it('should disable Previous button when canNavigatePrevious is false', () => {
      render(
        <SlotNavigationButtons
          {...defaultProps}
          canNavigatePrevious={false}
        />
      );

      expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    });

    it('should disable Next button when canNavigateNext is false', () => {
      render(
        <SlotNavigationButtons
          {...defaultProps}
          canNavigateNext={false}
        />
      );

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should call onNavigatePrevious when Previous button is clicked', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /prev/i }));

      expect(defaultProps.onNavigatePrevious).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigateNext when Next button is clicked', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      expect(defaultProps.onNavigateNext).toHaveBeenCalledTimes(1);
    });

    it('should display current startTime', () => {
      render(<SlotNavigationButtons {...defaultProps} startTime="14:30" />);

      expect(screen.getByText(/14:30/)).toBeInTheDocument();
    });
  });

  // ==========================================
  // User Story 2: Extend Button (T029-T030)
  // ==========================================

  describe('US2: extend button', () => {
    // T029: renders Extend button
    it('should render Extend button', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /extend|\+30|▼/i })).toBeInTheDocument();
    });

    // T030: disables Extend button when canExtend is false
    it('should disable Extend button when canExtend is false', () => {
      render(
        <SlotNavigationButtons
          {...defaultProps}
          canExtend={false}
        />
      );

      expect(screen.getByRole('button', { name: /extend|\+30|▼/i })).toBeDisabled();
    });

    it('should call onExtend when Extend button is clicked', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /extend|\+30|▼/i }));

      expect(defaultProps.onExtend).toHaveBeenCalledTimes(1);
    });

    it('should display current duration', () => {
      render(<SlotNavigationButtons {...defaultProps} duration={90} />);

      expect(screen.getByText(/1h 30/i)).toBeInTheDocument();
    });

    it('should display current endTime', () => {
      render(<SlotNavigationButtons {...defaultProps} endTime="12:30" />);

      expect(screen.getByText(/12:30/)).toBeInTheDocument();
    });
  });

  // ==========================================
  // User Story 3: Reduce Button (T042-T043)
  // ==========================================

  describe('US3: reduce button', () => {
    // T042: renders Reduce button
    it('should render Reduce button', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /reduce|-30|▲/i })).toBeInTheDocument();
    });

    // T043: disables Reduce button when canReduce is false
    it('should disable Reduce button when canReduce is false', () => {
      render(
        <SlotNavigationButtons
          {...defaultProps}
          canReduce={false}
        />
      );

      expect(screen.getByRole('button', { name: /reduce|-30|▲/i })).toBeDisabled();
    });

    it('should call onReduce when Reduce button is clicked', () => {
      render(<SlotNavigationButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /reduce|-30|▲/i }));

      expect(defaultProps.onReduce).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // Feature 009: Mobile UI Refinements - US1
  // ==========================================

  describe('US1 (009): hidden on mobile via CSS', () => {
    it('should have slot-nav-container class for CSS targeting', () => {
      const { container } = render(<SlotNavigationButtons {...defaultProps} />);
      expect(container.querySelector('.slot-nav-container')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Display and formatting
  // ==========================================

  describe('display', () => {
    it('should format duration as hours and minutes', () => {
      render(<SlotNavigationButtons {...defaultProps} duration={150} />);

      expect(screen.getByText(/2h 30/i)).toBeInTheDocument();
    });

    it('should format duration as minutes only for < 60', () => {
      render(<SlotNavigationButtons {...defaultProps} duration={30} />);

      expect(screen.getByText(/30.*min/i)).toBeInTheDocument();
    });

    it('should format duration as hours only for exact hours', () => {
      render(<SlotNavigationButtons {...defaultProps} duration={120} />);

      expect(screen.getByText(/2h/)).toBeInTheDocument();
    });
  });
});
