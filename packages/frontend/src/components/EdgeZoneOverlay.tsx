import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

export interface EdgeZoneOverlayProps {
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onExtend: () => void;
  onReduce: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  canExtend: boolean;
  canReduce: boolean;
  dataLoaded?: boolean;
  /** When false, edge zones still work but arrows are not visible */
  showNav?: boolean;
  children: ReactNode;
}

type FlashDirection = 'prev' | 'next' | 'extend' | 'reduce' | null;

const arrows: Record<Exclude<FlashDirection, null>, string> = {
  prev: '◀',
  next: '▶',
  extend: '▼',
  reduce: '▲',
};

const zoneBase: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
};

const flashStyle: React.CSSProperties = {
  fontSize: '24px',
  color: 'rgba(0, 0, 0, 0.5)',
  pointerEvents: 'none',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

const styles = {
  container: {
    position: 'relative',
  } as React.CSSProperties,
  left: {
    ...zoneBase,
    left: 0,
    top: 0,
    width: '5%',
    minWidth: '20px',
    height: '100%',
    zIndex: 3,
  } as React.CSSProperties,
  right: {
    ...zoneBase,
    right: 0,
    top: 0,
    width: '5%',
    minWidth: '20px',
    height: '100%',
    zIndex: 3,
  } as React.CSSProperties,
  top: {
    ...zoneBase,
    top: 0,
    left: 'max(5%, 20px)',
    right: 'max(5%, 20px)',
    height: '5%',
    minHeight: '20px',
    zIndex: 2,
  } as React.CSSProperties,
  bottom: {
    ...zoneBase,
    bottom: 0,
    left: 'max(5%, 20px)',
    right: 'max(5%, 20px)',
    height: '5%',
    minHeight: '20px',
    zIndex: 2,
  } as React.CSSProperties,
};

/** Shared hint container style for edge zones */
const hintContainerStyle: React.CSSProperties = {
  pointerEvents: 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: '8px',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const HINT_REAPPEAR_DELAY = 3000;

const ARROW_COLOR = 'rgba(0, 0, 0, 0.35)';

/** SVG triangle arrow pointing left: vertices at top-right, bottom-right, middle-left */
function LeftArrowSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points="100,0 100,100 0,50" fill={ARROW_COLOR} />
    </svg>
  );
}

/** SVG triangle arrow pointing right: vertices at top-left, bottom-left, middle-right */
function RightArrowSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points="0,0 0,100 100,50" fill={ARROW_COLOR} />
    </svg>
  );
}

/** SVG triangle arrow pointing up: vertices at left-bottom, right-bottom, middle-top */
function UpArrowSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points="0,100 100,100 50,0" fill={ARROW_COLOR} />
    </svg>
  );
}

/** SVG triangle arrow pointing down: vertices at left-top, right-top, middle-bottom */
function DownArrowSvg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points="0,0 100,0 50,100" fill={ARROW_COLOR} />
    </svg>
  );
}

export function EdgeZoneOverlay({
  onNavigatePrevious,
  onNavigateNext,
  onExtend,
  onReduce,
  canNavigatePrevious,
  canNavigateNext,
  canExtend,
  canReduce,
  dataLoaded = false,
  showNav = true,
  children,
}: EdgeZoneOverlayProps) {
  const [flashDirection, setFlashDirection] = useState<FlashDirection>(null);
  const [showEdgeHints, setShowEdgeHints] = useState(false);
  // Tracks whether all hints are suppressed after a click
  const [hintsSuppressed, setHintsSuppressed] = useState(false);

  // Show hints after data loads (with delay)
  useEffect(() => {
    if (!dataLoaded) { setShowEdgeHints(false); return; }
    const timer = setTimeout(() => setShowEdgeHints(true), HINT_REAPPEAR_DELAY);
    return () => clearTimeout(timer);
  }, [dataLoaded]);

  // When any arrow is clicked, suppress ALL hints and schedule reappearance
  const suppressAllHints = useCallback(() => {
    setHintsSuppressed(true);
    const timer = setTimeout(() => {
      setHintsSuppressed(false);
    }, HINT_REAPPEAR_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleZoneClick = (
    e: React.MouseEvent,
    direction: Exclude<FlashDirection, null>,
    canAct: boolean,
    action: () => void
  ) => {
    e.stopPropagation();
    if (!canAct) return;
    action();
    setFlashDirection(direction);
    // Immediately hide all hints
    suppressAllHints();
  };

  const handleAnimationEnd = () => {
    setFlashDirection(null);
  };

  const isHintVisible = (_direction: Exclude<FlashDirection, null>, canAct: boolean) =>
    showNav && showEdgeHints && canAct && !hintsSuppressed;

  // Swipe gesture detection – uses same callbacks as left/right edge arrows
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0 && canNavigateNext) {
      // Swipe left → navigate next (same as right arrow)
      onNavigateNext();
      setFlashDirection('next');
      suppressAllHints();
    } else if (dx > 0 && canNavigatePrevious) {
      // Swipe right → navigate previous (same as left arrow)
      onNavigatePrevious();
      setFlashDirection('prev');
      suppressAllHints();
    }
  }, [canNavigateNext, canNavigatePrevious, onNavigateNext, onNavigatePrevious, suppressAllHints]);

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left edge zone - single full-height arrow */}
      <div
        data-testid="edge-zone-left"
        style={styles.left}
        onClick={(e) => handleZoneClick(e, 'prev', canNavigatePrevious, onNavigatePrevious)}
      >
        {showNav && flashDirection === 'prev' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.prev}
          </span>
        )}
        {isHintVisible('prev', canNavigatePrevious) && (
          <span data-testid="edge-hint-left" className="edge-zone-hint" style={hintContainerStyle}>
            <LeftArrowSvg />
          </span>
        )}
      </div>

      {/* Right edge zone - single full-height arrow */}
      <div
        data-testid="edge-zone-right"
        style={styles.right}
        onClick={(e) => handleZoneClick(e, 'next', canNavigateNext, onNavigateNext)}
      >
        {showNav && flashDirection === 'next' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.next}
          </span>
        )}
        {isHintVisible('next', canNavigateNext) && (
          <span data-testid="edge-hint-right" className="edge-zone-hint" style={hintContainerStyle}>
            <RightArrowSvg />
          </span>
        )}
      </div>

      {/* Top edge zone - full-width bar */}
      <div
        data-testid="edge-zone-top"
        style={styles.top}
        onClick={(e) => handleZoneClick(e, 'reduce', canReduce, onReduce)}
      >
        {showNav && flashDirection === 'reduce' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.reduce}
          </span>
        )}
        {isHintVisible('reduce', canReduce) && (
          <span data-testid="edge-hint-top" className="edge-zone-hint" style={hintContainerStyle}>
            <UpArrowSvg />
          </span>
        )}
      </div>

      {/* Bottom edge zone - full-width bar */}
      <div
        data-testid="edge-zone-bottom"
        style={styles.bottom}
        onClick={(e) => handleZoneClick(e, 'extend', canExtend, onExtend)}
      >
        {showNav && flashDirection === 'extend' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.extend}
          </span>
        )}
        {isHintVisible('extend', canExtend) && (
          <span data-testid="edge-hint-bottom" className="edge-zone-hint" style={hintContainerStyle}>
            <DownArrowSvg />
          </span>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
