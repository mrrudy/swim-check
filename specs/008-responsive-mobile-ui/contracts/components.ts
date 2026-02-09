/**
 * Component Interface Contracts: Responsive Mobile UI
 *
 * These interfaces define the contracts for new and modified components.
 * They serve as the source of truth for implementation and testing.
 */

import { ReactNode } from 'react';

// ============================================================
// NEW: HamburgerMenu Component
// ============================================================

/**
 * HamburgerMenu - Collapsible navigation menu for mobile viewports.
 *
 * Renders inline in the header area. Self-contained: uses React Router
 * Links internally. No props needed — the menu items are the same
 * navigation items currently in App.tsx's <nav>.
 *
 * Behavior:
 * - Toggle button shows ☰ Menu text
 * - Dropdown slides open/closed (max-height CSS transition, 200ms)
 * - Closes on: item click, outside click, Escape key, toggle button
 * - ARIA: aria-expanded, aria-controls, aria-label
 * - Minimum 48x48px touch target for toggle button
 */
// No props interface needed — component is self-contained

// ============================================================
// NEW: EdgeZoneOverlay Component
// ============================================================

export interface EdgeZoneOverlayProps {
  /** Called when user clicks the left edge zone (5% of container width) */
  onNavigatePrevious: () => void;

  /** Called when user clicks the right edge zone (5% of container width) */
  onNavigateNext: () => void;

  /** Called when user clicks the bottom edge zone (5% of container height) */
  onExtend: () => void;

  /** Called when user clicks the top edge zone (5% of container height) */
  onReduce: () => void;

  /** Whether the left edge zone is active (false = no-op on click) */
  canNavigatePrevious: boolean;

  /** Whether the right edge zone is active (false = no-op on click) */
  canNavigateNext: boolean;

  /** Whether the bottom edge zone is active (false = no-op on click) */
  canExtend: boolean;

  /** Whether the top edge zone is active (false = no-op on click) */
  canReduce: boolean;

  /** Content to render inside the overlay container */
  children: ReactNode;
}

/**
 * EdgeZoneOverlay - Invisible touch/click zones around slot content.
 *
 * Wraps children in a position:relative container with four absolutely-positioned
 * overlay zones at the edges. Each zone is 5% of the container dimension
 * (min 20px). Horizontal zones (left/right) have higher z-index than vertical
 * (top/bottom) for corner priority.
 *
 * Visual feedback: A directional arrow (◀ ▶ ▲ ▼) briefly flashes on the
 * activated edge (300ms CSS animation). Disabled zones show no feedback.
 *
 * Clicks on edge zones call stopPropagation() to prevent reaching content below.
 */

// ============================================================
// NEW: useMediaQuery Hook
// ============================================================

/**
 * useMediaQuery - Subscribe to a CSS media query.
 *
 * @param query - CSS media query string, e.g. '(max-width: 799px)'
 * @returns boolean - true if the query currently matches
 *
 * Uses useSyncExternalStore + window.matchMedia for React 18
 * concurrent-mode-safe subscription.
 *
 * Usage:
 *   const isMobile = useMediaQuery('(max-width: 799px)');
 */

// ============================================================
// MODIFIED: App.tsx Layout Contract
// ============================================================

/**
 * App component responsive behavior contract:
 *
 * Viewport >= 800px (desktop):
 *   - Title: "Swim Check" at 24px bold
 *   - Subtitle: "Check lane availability..." visible at 14px
 *   - Navigation: inline flex row (Favorites, Search Pools, Scraping Status)
 *   - Header: multi-line, current sizing
 *
 * Viewport < 800px (mobile):
 *   - Title: "Swim Check" at 18px bold
 *   - Subtitle: hidden (display: none)
 *   - Navigation: HamburgerMenu component (☰ Menu button)
 *   - Header: single row, max-height 48px
 *   - App padding reduced from 20px to 8px 12px
 */

// ============================================================
// MODIFIED: Pages with EdgeZoneOverlay Integration
// ============================================================

/**
 * Home.tsx integration contract:
 *   - Wrap the CombinedSlotSection / MultiSlotView area with EdgeZoneOverlay
 *   - Pass navigation callbacks from useSlotNavigation hook
 *   - Pass boundary flags (canNavigatePrevious, canNavigateNext, etc.)
 *
 * PoolDetail.tsx integration contract:
 *   - Wrap the LaneGrid / slot display area with EdgeZoneOverlay
 *   - Pass navigation callbacks from useSlotNavigation hook
 *   - Pass boundary flags (canNavigatePrevious, canNavigateNext, etc.)
 *
 * Both pages: Existing keyboard navigation (arrow keys) continues to work
 * alongside edge-zone navigation. No changes to useSlotNavigation hook needed.
 */
