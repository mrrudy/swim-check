import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EdgeZoneOverlay } from './EdgeZoneOverlay';

const defaultProps = {
  onNavigatePrevious: vi.fn(),
  onNavigateNext: vi.fn(),
  onExtend: vi.fn(),
  onReduce: vi.fn(),
  canNavigatePrevious: true,
  canNavigateNext: true,
  canExtend: true,
  canReduce: true,
};

function renderOverlay(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  // Reset mocks
  props.onNavigatePrevious = vi.fn();
  props.onNavigateNext = vi.fn();
  props.onExtend = vi.fn();
  props.onReduce = vi.fn();
  Object.assign(props, overrides);

  return {
    ...render(
      <EdgeZoneOverlay {...props}>
        <div data-testid="child-content">Content</div>
      </EdgeZoneOverlay>
    ),
    props,
  };
}

describe('EdgeZoneOverlay', () => {
  it('renders children', () => {
    renderOverlay();
    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('calls onNavigateNext on right edge click', () => {
    const onNavigateNext = vi.fn();
    renderOverlay({ onNavigateNext });
    const rightZone = screen.getByTestId('edge-zone-right');
    fireEvent.click(rightZone);
    expect(onNavigateNext).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigatePrevious on left edge click', () => {
    const onNavigatePrevious = vi.fn();
    renderOverlay({ onNavigatePrevious });
    const leftZone = screen.getByTestId('edge-zone-left');
    fireEvent.click(leftZone);
    expect(onNavigatePrevious).toHaveBeenCalledTimes(1);
  });

  it('calls onExtend on bottom edge click', () => {
    const onExtend = vi.fn();
    renderOverlay({ onExtend });
    const bottomZone = screen.getByTestId('edge-zone-bottom');
    fireEvent.click(bottomZone);
    expect(onExtend).toHaveBeenCalledTimes(1);
  });

  it('calls onReduce on top edge click', () => {
    const onReduce = vi.fn();
    renderOverlay({ onReduce });
    const topZone = screen.getByTestId('edge-zone-top');
    fireEvent.click(topZone);
    expect(onReduce).toHaveBeenCalledTimes(1);
  });

  it('does NOT call callback when canNavigateNext is false', () => {
    const onNavigateNext = vi.fn();
    renderOverlay({ onNavigateNext, canNavigateNext: false });
    const rightZone = screen.getByTestId('edge-zone-right');
    fireEvent.click(rightZone);
    expect(onNavigateNext).not.toHaveBeenCalled();
  });

  it('does NOT call callback when canNavigatePrevious is false', () => {
    const onNavigatePrevious = vi.fn();
    renderOverlay({ onNavigatePrevious, canNavigatePrevious: false });
    const leftZone = screen.getByTestId('edge-zone-left');
    fireEvent.click(leftZone);
    expect(onNavigatePrevious).not.toHaveBeenCalled();
  });

  it('does NOT call callback when canExtend is false', () => {
    const onExtend = vi.fn();
    renderOverlay({ onExtend, canExtend: false });
    const bottomZone = screen.getByTestId('edge-zone-bottom');
    fireEvent.click(bottomZone);
    expect(onExtend).not.toHaveBeenCalled();
  });

  it('does NOT call callback when canReduce is false', () => {
    const onReduce = vi.fn();
    renderOverlay({ onReduce, canReduce: false });
    const topZone = screen.getByTestId('edge-zone-top');
    fireEvent.click(topZone);
    expect(onReduce).not.toHaveBeenCalled();
  });

  it('shows visual feedback arrow on right edge click', () => {
    const onNavigateNext = vi.fn();
    renderOverlay({ onNavigateNext });
    const rightZone = screen.getByTestId('edge-zone-right');
    fireEvent.click(rightZone);
    expect(screen.getByText('▶')).toBeDefined();
  });

  it('shows visual feedback arrow on left edge click', () => {
    const onNavigatePrevious = vi.fn();
    renderOverlay({ onNavigatePrevious });
    const leftZone = screen.getByTestId('edge-zone-left');
    fireEvent.click(leftZone);
    expect(screen.getByText('◀')).toBeDefined();
  });

  it('clears feedback after animation ends', () => {
    const onNavigateNext = vi.fn();
    renderOverlay({ onNavigateNext });
    const rightZone = screen.getByTestId('edge-zone-right');
    fireEvent.click(rightZone);

    const arrow = screen.getByText('▶');
    fireEvent.animationEnd(arrow);

    // Arrow should be gone after animation
    expect(screen.queryByText('▶')).toBeNull();
  });
});

// ==========================================
// Feature 009: Edge Zone Hints (US2)
// ==========================================

describe('EdgeZoneOverlay edge zone hints (009-US2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const hintProps = {
    onNavigatePrevious: vi.fn(),
    onNavigateNext: vi.fn(),
    onExtend: vi.fn(),
    onReduce: vi.fn(),
    canNavigatePrevious: true,
    canNavigateNext: true,
    canExtend: true,
    canReduce: true,
    dataLoaded: true,
  };

  function renderWithHints(overrides = {}) {
    const props = { ...hintProps, ...overrides };
    return render(
      <EdgeZoneOverlay {...props}>
        <div data-testid="child-content">Content</div>
      </EdgeZoneOverlay>
    );
  }

  it('does NOT show hints initially even when dataLoaded=true', () => {
    renderWithHints();
    expect(screen.queryByTestId('edge-hint-left')).toBeNull();
    expect(screen.queryByTestId('edge-hint-right')).toBeNull();
    expect(screen.queryByTestId('edge-hint-top')).toBeNull();
    expect(screen.queryByTestId('edge-hint-bottom')).toBeNull();
  });

  it('shows hints after 3 seconds when dataLoaded=true', () => {
    renderWithHints();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('edge-hint-left')).toBeInTheDocument();
    expect(screen.getByTestId('edge-hint-right')).toBeInTheDocument();
    expect(screen.getByTestId('edge-hint-top')).toBeInTheDocument();
    expect(screen.getByTestId('edge-hint-bottom')).toBeInTheDocument();
  });

  it('does NOT show hints for disabled zones', () => {
    renderWithHints({
      canNavigatePrevious: false,
      canExtend: false,
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByTestId('edge-hint-left')).toBeNull();
    expect(screen.queryByTestId('edge-hint-bottom')).toBeNull();
    // Enabled zones should still show hints
    expect(screen.getByTestId('edge-hint-right')).toBeInTheDocument();
    expect(screen.getByTestId('edge-hint-top')).toBeInTheDocument();
  });

  it('does NOT show hints when dataLoaded=false', () => {
    renderWithHints({ dataLoaded: false });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId('edge-hint-left')).toBeNull();
    expect(screen.queryByTestId('edge-hint-right')).toBeNull();
  });

  it('resets timer when dataLoaded changes to false', () => {
    const { rerender } = renderWithHints();

    // Advance 2 seconds (not yet 3)
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId('edge-hint-left')).toBeNull();

    // Set dataLoaded to false — should reset
    rerender(
      <EdgeZoneOverlay {...hintProps} dataLoaded={false}>
        <div data-testid="child-content">Content</div>
      </EdgeZoneOverlay>
    );

    // Set dataLoaded back to true
    rerender(
      <EdgeZoneOverlay {...hintProps} dataLoaded={true}>
        <div data-testid="child-content">Content</div>
      </EdgeZoneOverlay>
    );

    // After 2 more seconds (total 2 from new timer), hints should NOT show yet
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId('edge-hint-left')).toBeNull();

    // After 1 more second (total 3 from reset), hints should show
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('edge-hint-left')).toBeInTheDocument();
  });
});
