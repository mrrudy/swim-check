import { useState, useEffect, type ReactNode } from 'react';

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
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    padding: '10% 0',
  } as React.CSSProperties,
  right: {
    ...zoneBase,
    right: 0,
    top: 0,
    width: '5%',
    minWidth: '20px',
    height: '100%',
    zIndex: 3,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    padding: '10% 0',
  } as React.CSSProperties,
  top: {
    ...zoneBase,
    top: 0,
    left: 0,
    height: '5%',
    minHeight: '20px',
    width: '100%',
    zIndex: 2,
  } as React.CSSProperties,
  bottom: {
    ...zoneBase,
    bottom: 0,
    left: 0,
    height: '5%',
    minHeight: '20px',
    width: '100%',
    zIndex: 2,
  } as React.CSSProperties,
};

const hintStyle: React.CSSProperties = {
  fontSize: '24px',
  color: 'rgba(0, 0, 0, 0.45)',
  pointerEvents: 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.08)',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

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
  children,
}: EdgeZoneOverlayProps) {
  const [flashDirection, setFlashDirection] = useState<FlashDirection>(null);
  const [showEdgeHints, setShowEdgeHints] = useState(false);

  useEffect(() => {
    if (!dataLoaded) { setShowEdgeHints(false); return; }
    const timer = setTimeout(() => setShowEdgeHints(true), 3000);
    return () => clearTimeout(timer);
  }, [dataLoaded]);

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
  };

  const handleAnimationEnd = () => {
    setFlashDirection(null);
  };

  return (
    <div style={styles.container}>
      {/* Left edge zone */}
      <div
        data-testid="edge-zone-left"
        style={styles.left}
        onClick={(e) => handleZoneClick(e, 'prev', canNavigatePrevious, onNavigatePrevious)}
      >
        {flashDirection === 'prev' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.prev}
          </span>
        )}
        {showEdgeHints && canNavigatePrevious && (
          <>
            <span data-testid="edge-hint-left" className="edge-zone-hint" style={hintStyle}>
              {arrows.prev}
            </span>
            <span className="edge-zone-hint" style={hintStyle}>
              {arrows.prev}
            </span>
            <span className="edge-zone-hint" style={hintStyle}>
              {arrows.prev}
            </span>
          </>
        )}
      </div>

      {/* Right edge zone */}
      <div
        data-testid="edge-zone-right"
        style={styles.right}
        onClick={(e) => handleZoneClick(e, 'next', canNavigateNext, onNavigateNext)}
      >
        {flashDirection === 'next' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.next}
          </span>
        )}
        {showEdgeHints && canNavigateNext && (
          <>
            <span data-testid="edge-hint-right" className="edge-zone-hint" style={hintStyle}>
              {arrows.next}
            </span>
            <span className="edge-zone-hint" style={hintStyle}>
              {arrows.next}
            </span>
            <span className="edge-zone-hint" style={hintStyle}>
              {arrows.next}
            </span>
          </>
        )}
      </div>

      {/* Top edge zone */}
      <div
        data-testid="edge-zone-top"
        style={styles.top}
        onClick={(e) => handleZoneClick(e, 'reduce', canReduce, onReduce)}
      >
        {flashDirection === 'reduce' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.reduce}
          </span>
        )}
        {showEdgeHints && canReduce && (
          <span data-testid="edge-hint-top" className="edge-zone-hint" style={hintStyle}>
            {arrows.reduce}
          </span>
        )}
      </div>

      {/* Bottom edge zone */}
      <div
        data-testid="edge-zone-bottom"
        style={styles.bottom}
        onClick={(e) => handleZoneClick(e, 'extend', canExtend, onExtend)}
      >
        {flashDirection === 'extend' && (
          <span className="edge-zone-flash" style={flashStyle} onAnimationEnd={handleAnimationEnd}>
            {arrows.extend}
          </span>
        )}
        {showEdgeHints && canExtend && (
          <span data-testid="edge-hint-bottom" className="edge-zone-hint" style={hintStyle}>
            {arrows.extend}
          </span>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
