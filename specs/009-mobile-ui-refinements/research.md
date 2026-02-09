# Research: Mobile UI Refinements

**Feature**: 009-mobile-ui-refinements | **Date**: 2026-02-08

## Topic 1: Hiding Slot Navigation Box on Mobile

**Decision**: Use CSS `display: none` in media query on `.slot-nav-container`.

**Rationale**: The codebase already uses this pattern (`.nav-inline { display: none }` in responsive.css). CSS `display: none` removes elements from the render tree entirely (best performance), hides from screen readers (correct since edge zones replace the nav), and requires zero JavaScript. The `.slot-nav-container` class already exists on the component.

**Alternatives Considered**:
- **Conditional rendering with `useMediaQuery`**: Prevents mounting entirely but causes SSR hydration mismatches, adds JavaScript overhead, and is unnecessary when the component has no expensive side effects. Rejected for being more complex with no practical benefit.
- **CSS `visibility: hidden`**: Still takes up space in layout, which defeats the purpose of reclaiming screen real estate. Rejected.

---

## Topic 2: Implementing Delayed Edge Zone Hints

**Decision**: Use `useEffect` with `setTimeout` in EdgeZoneOverlay, triggered when data is loaded. Render semi-transparent arrow symbols (◀ ▶ ▲ ▼) at ~20-30% opacity.

**Rationale**: The timer must start only after data loads (not on mount), which CSS `animation-delay` cannot detect. `useEffect` provides automatic cleanup via return function, preventing memory leaks on unmount or re-navigation. The existing codebase already uses `setTimeout` for UI feedback (e.g., `showSaved` in TimeSlotPicker).

**Implementation Pattern**:
```typescript
const [showEdgeHints, setShowEdgeHints] = useState(false);

useEffect(() => {
  if (!dataLoaded) { setShowEdgeHints(false); return; }
  const timer = setTimeout(() => setShowEdgeHints(true), 3000);
  return () => clearTimeout(timer);
}, [dataLoaded]);
```

**Alternatives Considered**:
- **CSS `animation-delay`**: Cannot conditionally start based on data load state. If element is in DOM from mount, the delay runs from mount time, not data load time. Rejected.
- **Web Animations API**: Overkill for a simple delayed opacity change. Imperative API doesn't align well with React's declarative model. Rejected.

**Hint Rendering**: Show arrows at each active edge zone as persistent low-opacity overlays. Only render hints where `can*` props are true (e.g., no left hint if `canNavigatePrevious` is false). Use existing arrow symbols already defined in EdgeZoneOverlay.

---

## Topic 3: Reordering Refresh Button on Mobile

**Decision**: Use CSS Flexbox `order` property to move the actions row below the data grid on mobile.

**Rationale**: Pure CSS solution preserves DOM order (important for keyboard tab order and screen readers), requires no JavaScript, and aligns with the existing flexbox layout of the page. The parent container already uses flex column layout.

**Implementation**:
```css
@media (max-width: 799px) {
  .pool-detail-actions { order: 10; }
}
```

**Alternatives Considered**:
- **Conditional rendering (render in two places, show/hide)**: Code duplication, state synchronization issues, violates DRY. Rejected.
- **CSS Grid named areas**: More verbose than needed for single-element reordering. Would require restructuring the parent container. Rejected for unnecessary complexity.
- **React Portal**: Extreme overkill for visual reordering. Breaks component tree structure. Rejected.

**Note**: The DOM order (refresh above data) is preserved for accessibility. Screen readers announce in logical order; mobile users see data first visually.

---

## Topic 4: Keeping Time Inputs in a Single Row

**Decision**: Override the existing `flex-direction: column` rule, keep `flex-direction: row` on mobile, reduce `min-width` values using `clamp()`, and allow graceful wrap only below ~280px.

**Rationale**: The current responsive.css forces `flex-direction: column !important` on `.time-slot-picker-responsive`, which wastes vertical space. The three inputs (date ~110px min, time selects ~70px min) can fit in a row on screens as narrow as 320px (110 + 70 + 70 + gaps = ~274px). Using `clamp()` provides fluid scaling between breakpoints.

**Sizing**:
- Date input: `min-width: clamp(100px, 28vw, 150px)` — 100px floor, scales with viewport, 150px cap
- Time selects: `min-width: clamp(65px, 18vw, 100px)` — 65px floor, scales with viewport, 100px cap
- At 375px (iPhone SE): date=105px, selects=67px each → 105+67+67+24(gaps) = 263px — fits
- At 320px: date=100px (floor), selects=65px each → 100+65+65+24 = 254px — fits
- Below ~280px: graceful wrap via `flex-wrap: wrap`

**Alternatives Considered**:
- **Fixed `min-width` reduction only**: Doesn't scale smoothly; either wastes space at 700px or is too tight at 350px. Rejected.
- **Pure viewport units**: No floor constraint, inputs can become unusably small. Rejected.
- **Remove `min-width` entirely**: Inputs collapse to content width, inconsistent sizing. Rejected.

**Browser Compatibility**: CSS `clamp()` is supported in all evergreen browsers (Chrome 79+, Safari 13.1+, Firefox 75+). Acceptable for this project's target platforms.

---

## Summary

| Requirement | Approach | Complexity |
|------------|----------|------------|
| Hide slot nav | CSS `display: none` in media query | Trivial |
| Edge zone hints | `useEffect` + `setTimeout`, conditional arrow rendering | Low |
| Move refresh button | CSS `order` property | Trivial |
| Single-row time inputs | Override `flex-direction`, `clamp()` min-widths | Low |

All approaches use existing patterns from the codebase, require no new dependencies, and keep the desktop layout completely unchanged.
