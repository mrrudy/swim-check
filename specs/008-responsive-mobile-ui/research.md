# Research: Responsive Mobile UI

**Feature**: 008-responsive-mobile-ui | **Date**: 2026-02-07

## R1: Responsive CSS Approach (Hook + Minimal CSS)

**Decision**: Combination of `useMediaQuery` hook + one global CSS file (`responsive.css`)

**Rationale**: The app already uses inline `CSSProperties` styles everywhere. Inline styles cannot express media queries. A hybrid approach uses a global CSS file for breakpoint-dependent layout rules and a `useMediaQuery` hook for conditional rendering in JavaScript (e.g., hamburger vs inline nav). This maintains consistency with the existing one-CSS-file precedent (`CombinedSlotSection.css`).

**Alternatives Considered**:
- Pure CSS classes: Would require abandoning inline styles entirely — too disruptive
- CSS modules per component: Overkill for simple breakpoint logic
- Hook-only with conditional inline styles: Cannot replicate CSS media query behavior; resize listeners are janky
- Global CSS only: Would need className additions but no conditional rendering — insufficient for hamburger toggle

## R2: useMediaQuery Hook Implementation

**Decision**: Use React 18's `useSyncExternalStore` with `window.matchMedia`

**Rationale**: `useSyncExternalStore` is purpose-built for subscribing to external stores like media queries. More performant and cleaner than `useState + useEffect`. Browser's native `matchMedia` API handles all the viewport detection.

**Implementation**:
```typescript
import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const mediaQueryList = window.matchMedia(query);
  return useSyncExternalStore(
    (callback) => {
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    },
    () => mediaQueryList.matches,
    () => false // SSR fallback
  );
}
```

**Alternatives Considered**:
- `useState + useEffect`: More verbose, less performant with React 18 concurrent rendering
- `window.innerWidth` tracking: Doesn't match CSS media query behavior exactly

## R3: Hamburger Menu — Dropdown Style

**Decision**: Dropdown menu (slides down from header)

**Rationale**: Only 3 navigation items (Favorites, Search Pools, Scraping Status). A dropdown is simpler than a side drawer — no overlay management, z-index stacking, or body scroll locking needed. The current header already has vertical structure making downward expansion natural.

**Alternatives Considered**:
- Side drawer: Better for extensive navigation hierarchies; overkill for 3 items
- Full-screen overlay: Wastes screen space for a short menu

## R4: Hamburger Icon

**Decision**: Unicode character `☰` (U+2630) with visible "Menu" text label

**Rationale**: Zero dependencies, no SVG or CSS drawing needed. The "Menu" text label solves the screen reader issue (Unicode `☰` is announced as "trigram for heaven"). Matches the codebase's text-based style.

**Alternatives Considered**:
- CSS-only icon (three divs): More verbose; only worthwhile if animating to X
- Inline SVG: Overkill for three horizontal lines
- Unicode only (no text): Screen readers announce incorrectly

## R5: Click Outside to Close

**Decision**: `useRef` + `useEffect` with `mousedown` listener

**Rationale**: React-idiomatic, ~15 lines, automatic cleanup via useEffect return. `mousedown` fires before `click` for faster responsiveness.

**Alternatives Considered**:
- `stopPropagation` approach: Fragile if nested components also stop propagation
- Global `onClick`: Fires on every click even when menu is closed

## R6: Menu Open/Close Animation

**Decision**: `max-height` CSS transition with `overflow: hidden`

**Rationale**: Single CSS property transition, GPU-accelerated, no JavaScript animation logic. `max-height: 0` → `max-height: 500px` with `transition: max-height 0.2s ease-in-out`. Gracefully degrades if transitions are disabled.

**Alternatives Considered**:
- `height` transition: Requires knowing exact pixel height
- `transform: translateY()`: Needs absolute positioning
- `opacity + visibility`: No sliding effect

## R7: Edge-Zone Implementation — Positioned Divs

**Decision**: Use absolutely-positioned overlay divs (one per edge zone)

**Rationale**: Each zone gets its own `onClick` handler — more declarative and easier to test than coordinate-based detection. Browser handles hit testing natively. Corner overlap priority is solved via `z-index` (horizontal zones = z-index 3, vertical = z-index 2).

**Alternatives Considered**:
- Single container with coordinate detection: Requires `getBoundingClientRect()` per click + manual zone calculation. Harder to test, more complex conditional logic.

## R8: Edge-Zone Visual Feedback

**Decision**: CSS keyframe animation triggered via React state + `onAnimationEnd`

**Rationale**: CSS animations are GPU-accelerated and timing is precise. A brief directional arrow (e.g., `◀` `▶` `▲` `▼`) appears with fade-in/fade-out over 300ms. React state controls which arrow is showing; `onAnimationEnd` clears the state.

```css
@keyframes edge-flash {
  0% { opacity: 0; }
  30% { opacity: 0.8; }
  100% { opacity: 0; }
}
```

**Alternatives Considered**:
- Pure React state with setTimeout: Potential timing drift, more code
- No visual feedback: Spec requires it (FR-012)

## R9: Edge-Zone Corner Priority

**Decision**: Z-index layering — horizontal zones (left/right) at z-index 3, vertical zones (top/bottom) at z-index 2

**Rationale**: Browser handles hit detection automatically. No conditional JavaScript logic needed. When zones overlap in corners, the higher z-index element receives the click.

**Alternatives Considered**:
- Manual coordinate check in handler: More complex, harder to maintain
- 8 separate zones (4 edges + 4 corners): 8 elements instead of 4 — unnecessary complexity

## R10: Edge-Zone Minimum Touch Target

**Decision**: CSS `min-width: 20px` / `min-height: 20px` on edge-zone divs

**Rationale**: Combined with `width: 5%` / `height: 5%`, the browser automatically uses whichever is larger. No JavaScript measurement needed. Works responsively across all screen sizes.

**Note**: The spec requires 20px minimum. WCAG 2.5.8 recommends 24px (AA) or 44px (AAA). The 20px minimum is acceptable for these invisible navigation zones since the main content area remains fully interactive.

**Alternatives Considered**:
- JavaScript resize listener: Adds complexity, potential layout thrashing
- CSS `max(5%, 20px)`: Slightly cleaner but `min-width` is more widely understood

## R11: Viewport Meta Tag

**Decision**: No changes needed — already correctly configured

**Finding**: `packages/frontend/index.html` already contains `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. This is the industry-standard configuration for responsive web apps.

## R12: Accessibility for Hamburger Menu

**Decision**: Full ARIA attribute set + Escape key support

**Required attributes**:
- Button: `aria-label="Toggle navigation menu"`, `aria-expanded={isOpen}`, `aria-controls="mobile-menu"`
- Nav: `id="mobile-menu"`, `role="navigation"`, `aria-label="Main navigation"`
- Escape key closes menu and returns focus to toggle button
- Minimum 48x48px touch target for the button

**Alternatives Considered**:
- Minimal ARIA (just `aria-expanded`): Insufficient for screen readers
- Focus trapping: Not needed for dropdowns (only for modals)
