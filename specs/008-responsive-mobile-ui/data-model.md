# Component Model: Responsive Mobile UI

**Feature**: 008-responsive-mobile-ui | **Date**: 2026-02-07

> This feature is frontend-only. There are no database entities or backend data model changes. This document defines the component model and state shapes.

## New Components

### 1. HamburgerMenu

**Purpose**: Collapsible navigation menu for mobile viewports (<800px)

**State**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | Whether the dropdown menu is visible |

**Props**: None (self-contained; uses React Router `Link` internally)

**Behavior**:
- Renders a toggle button (`☰ Menu`) and a dropdown nav
- Dropdown slides open/closed via `max-height` CSS transition
- Closes on: navigation item click, outside click (`mousedown` listener), Escape key
- ARIA: `aria-expanded`, `aria-controls`, `aria-label`

**Refs**:
| Ref | Type | Purpose |
|-----|------|---------|
| `menuRef` | `HTMLDivElement` | Click-outside detection boundary |
| `buttonRef` | `HTMLButtonElement` | Return focus on Escape key close |

---

### 2. EdgeZoneOverlay

**Purpose**: Invisible edge-zone overlays for touch-friendly slot navigation

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onNavigatePrevious` | `() => void` | Yes | Called on left edge click |
| `onNavigateNext` | `() => void` | Yes | Called on right edge click |
| `onExtend` | `() => void` | Yes | Called on bottom edge click |
| `onReduce` | `() => void` | Yes | Called on top edge click |
| `canNavigatePrevious` | `boolean` | Yes | Disables left edge zone |
| `canNavigateNext` | `boolean` | Yes | Disables right edge zone |
| `canExtend` | `boolean` | Yes | Disables bottom edge zone |
| `canReduce` | `boolean` | Yes | Disables top edge zone |
| `children` | `ReactNode` | Yes | Content wrapped by the overlay |

**State**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `flashDirection` | `'prev' \| 'next' \| 'extend' \| 'reduce' \| null` | `null` | Currently flashing indicator direction |

**Layout** (positioned within a `position: relative` container):
- Left zone: `position: absolute; left: 0; top: 0; width: 5%; min-width: 20px; height: 100%; z-index: 3`
- Right zone: `position: absolute; right: 0; top: 0; width: 5%; min-width: 20px; height: 100%; z-index: 3`
- Top zone: `position: absolute; top: 0; left: 0; height: 5%; min-height: 20px; width: 100%; z-index: 2`
- Bottom zone: `position: absolute; bottom: 0; left: 0; height: 5%; min-height: 20px; width: 100%; z-index: 2`
- Content: `position: relative; z-index: 1`

**Corner Priority**: Horizontal zones (z-index 3) over vertical zones (z-index 2)

**Visual Feedback**: Directional arrow character (`◀` `▶` `▲` `▼`) centered in the activated zone, animated with CSS keyframe `edge-flash` (300ms fade-in/fade-out).

---

## New Hook

### 3. useMediaQuery

**Purpose**: Subscribe to CSS media query matches for conditional rendering

**Signature**: `function useMediaQuery(query: string): boolean`

**Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `query` | `string` | CSS media query string, e.g. `'(max-width: 799px)'` |

**Returns**: `boolean` — `true` if the query matches, `false` otherwise

**Implementation**: Uses `useSyncExternalStore` + `window.matchMedia` for React 18 concurrent-mode-safe subscription.

---

## New CSS File

### 4. responsive.css

**Purpose**: Global breakpoint-dependent layout rules that cannot be expressed as inline styles

**Breakpoint**: `800px` (below = mobile, at/above = desktop)

**Rules**:
| Selector | Desktop (>=800px) | Mobile (<800px) |
|----------|-------------------|-----------------|
| `.app-container` | `padding: 20px` | `padding: 8px 12px` |
| `.app-header` | Current sizing | `max-height: 48px`, compact padding |
| `.app-title` | `font-size: 24px` | `font-size: 18px` |
| `.app-subtitle` | Visible | `display: none` |
| `.nav-inline` | `display: flex` | `display: none` |
| `.nav-hamburger` | `display: none` | `display: block` |
| `.slot-nav-buttons .row` | Horizontal layout | Compact padding |
| `.lane-grid` | `minmax(100px, 1fr)` | `minmax(80px, 1fr)` |

---

## Modified Components

### 5. App.tsx (Modified)

**Changes**:
- Add `className` attributes alongside existing inline styles for responsive targeting
- Conditionally render `<HamburgerMenu />` (mobile) vs inline `<nav>` (desktop) using `useMediaQuery`
- Title gets `className="app-title"`, subtitle gets `className="app-subtitle"`

### 6. Home.tsx (Modified)

**Changes**:
- Wrap slot display area with `<EdgeZoneOverlay>`, passing navigation callbacks from `useSlotNavigation`

### 7. PoolDetail.tsx (Modified)

**Changes**:
- Wrap slot display area with `<EdgeZoneOverlay>`, passing navigation callbacks from `useSlotNavigation`

### 8. SlotNavigationButtons.tsx (Modified)

**Changes**:
- Add `className` for responsive CSS targeting
- Reduce padding/font-size on mobile via responsive.css rules

---

## State Transitions

### HamburgerMenu State Machine

```
CLOSED → [button click] → OPEN
OPEN → [nav item click] → CLOSED (+ route change)
OPEN → [outside click] → CLOSED
OPEN → [Escape key] → CLOSED (+ focus to button)
OPEN → [button click] → CLOSED
OPEN → [viewport >= 800px] → CLOSED (component unmounts)
```

### EdgeZoneOverlay Flash State

```
null → [edge click where can{Direction} = true] → direction
direction → [animationend event, 300ms] → null
```
