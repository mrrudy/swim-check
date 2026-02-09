/**
 * NavigableSlotDisplay - Shared wrapper for slot content with edge zone navigation,
 * keyboard shortcuts, and navigation buttons.
 *
 * Used by both PoolDetail and Home (favorites) pages to ensure consistent
 * navigation behavior and a single place to adjust the display.
 *
 * 009-mobile-ui-refinements
 */

import { useState, useCallback, type ReactNode } from 'react';
import { SlotNavigationButtons } from './SlotNavigationButtons';
import { EdgeZoneOverlay } from './EdgeZoneOverlay';
import { KeyboardHints } from './KeyboardHints';
import type { UseSlotNavigationReturn } from '../hooks/useSlotNavigation';

export interface NavigableSlotDisplayProps {
  /** Navigation state and actions from useSlotNavigation */
  navigation: UseSlotNavigationReturn;
  /** Whether data has loaded (controls edge hint visibility) */
  dataLoaded: boolean;
  /** Whether to show the SlotNavigationButtons (hidden on mobile via CSS) */
  showNavigationButtons?: boolean;
  /** Whether to show keyboard hints in the navigation buttons */
  showKeyboardHints?: boolean;
  /** When false, edge arrows are hidden but zones still work */
  showNav?: boolean;
  /** Slot content to render inside the EdgeZoneOverlay */
  children: ReactNode;
}

const styles = {
  focusContainer: {
    outline: 'none',
  } as React.CSSProperties,
  focusContainerFocused: {
    outline: '2px solid #0066cc',
    outlineOffset: '2px',
    borderRadius: '8px',
  } as React.CSSProperties,
};

export function NavigableSlotDisplay({
  navigation,
  dataLoaded,
  showNavigationButtons = true,
  showKeyboardHints = true,
  showNav = true,
  children,
}: NavigableSlotDisplayProps) {
  const [hasFocus, setHasFocus] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      navigation.handleKeyDown(e);
    },
    [navigation]
  );

  return (
    <>
      {/* Focusable container with keyboard navigation + nav buttons (hidden on mobile via CSS) */}
      <div
        className="slot-nav-wrapper"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        style={{
          ...styles.focusContainer,
          ...(hasFocus ? styles.focusContainerFocused : {}),
        }}
      >
        {showNavigationButtons && (
          <SlotNavigationButtons
            startTime={navigation.startTime}
            endTime={navigation.endTime}
            duration={navigation.duration}
            canNavigatePrevious={navigation.canNavigatePrevious}
            canNavigateNext={navigation.canNavigateNext}
            canExtend={navigation.canExtend}
            canReduce={navigation.canReduce}
            onNavigatePrevious={navigation.navigatePrevious}
            onNavigateNext={navigation.navigateNext}
            onExtend={navigation.extendDuration}
            onReduce={navigation.reduceDuration}
            showKeyboardHints={showKeyboardHints}
          />
        )}
        {!showKeyboardHints && <KeyboardHints />}
      </div>

      {/* Edge zone overlay wrapping slot content */}
      <EdgeZoneOverlay
        onNavigatePrevious={navigation.navigatePrevious}
        onNavigateNext={navigation.navigateNext}
        onExtend={navigation.extendDuration}
        onReduce={navigation.reduceDuration}
        canNavigatePrevious={navigation.canNavigatePrevious}
        canNavigateNext={navigation.canNavigateNext}
        canExtend={navigation.canExtend}
        canReduce={navigation.canReduce}
        dataLoaded={dataLoaded}
        showNav={showNav}
      >
        {children}
      </EdgeZoneOverlay>
    </>
  );
}
