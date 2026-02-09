# Quickstart: Responsive Mobile UI

**Feature**: 008-responsive-mobile-ui | **Branch**: `008-responsive-mobile-ui`

## Prerequisites

- Node.js 20 LTS
- npm (workspace-aware)
- Existing swim-check codebase with frontend running

## Setup

```bash
# Clone and switch to feature branch
git checkout 008-responsive-mobile-ui

# Install dependencies (from repo root)
npm install

# Start frontend dev server
cd packages/frontend
npm run dev
# → http://localhost:5173 (proxies API to http://localhost:3000)
```

## Implementation Order (Test-First)

Per the constitution, each step follows Red-Green-Refactor.

### Step 1: useMediaQuery Hook
1. Write test: `useMediaQuery.test.ts` — mock `window.matchMedia`, verify returns `true`/`false` based on query match
2. Implement: `hooks/useMediaQuery.ts` — `useSyncExternalStore` + `matchMedia`
3. Verify test passes

### Step 2: HamburgerMenu Component
1. Write tests: `HamburgerMenu.test.tsx`
   - Renders toggle button with ☰ text
   - Opens dropdown on button click
   - Closes on item click, outside click, Escape key
   - All 3 nav items present in dropdown
   - ARIA attributes correct
2. Implement: `components/HamburgerMenu.tsx`
3. Verify tests pass

### Step 3: EdgeZoneOverlay Component
1. Write tests: `EdgeZoneOverlay.test.tsx`
   - Renders children
   - Calls `onNavigateNext` when right edge clicked
   - Calls `onNavigatePrevious` when left edge clicked
   - Calls `onExtend` when bottom edge clicked
   - Calls `onReduce` when top edge clicked
   - Does NOT call callback when `can*` prop is `false`
   - Shows visual feedback arrow on click
2. Implement: `components/EdgeZoneOverlay.tsx`
3. Verify tests pass

### Step 4: responsive.css + App.tsx Integration
1. Create `responsive.css` with mobile breakpoint rules
2. Import in `main.tsx`
3. Modify `App.tsx`:
   - Add class names alongside inline styles
   - Conditionally render HamburgerMenu vs inline nav using `useMediaQuery`
4. Test manually at various viewport widths

### Step 5: Edge-Zone Integration in Pages
1. Modify `Home.tsx` — wrap slot area with `EdgeZoneOverlay`
2. Modify `PoolDetail.tsx` — wrap slot area with `EdgeZoneOverlay`
3. Verify keyboard navigation still works

### Step 6: Responsive Layout Polish
1. Add class names to `SlotNavigationButtons`, `LaneGrid`, `PoolCard`, `TimeSlotPicker`
2. Verify no horizontal scrollbar at 320px–1920px viewports
3. Verify all pages reflow cleanly

## Testing

```bash
# Run all frontend tests
cd packages/frontend
npm test

# Run specific test file
npx vitest run src/hooks/useMediaQuery.test.ts
npx vitest run src/components/HamburgerMenu.test.tsx
npx vitest run src/components/EdgeZoneOverlay.test.tsx
```

## Verification Checklist

- [ ] Navigation collapses to hamburger below 800px (SC-002)
- [ ] All menu items accessible via one tap from hamburger (SC-002)
- [ ] No horizontal scrollbar 320px–1920px (SC-001)
- [ ] Header ≤48px height on mobile (SC-004)
- [ ] Edge-zone feedback appears <100ms, disappears <300ms (SC-005)
- [ ] Menu toggle <200ms perceived transition (SC-006)
- [ ] Keyboard shortcuts (arrow keys) still work (SC-007)
- [ ] Edge zones fire correct navigation actions (SC-003)

## Key Files

| File | Status | Purpose |
|------|--------|---------|
| `src/hooks/useMediaQuery.ts` | NEW | Responsive breakpoint hook |
| `src/components/HamburgerMenu.tsx` | NEW | Collapsible mobile menu |
| `src/components/EdgeZoneOverlay.tsx` | NEW | Touch navigation zones |
| `src/responsive.css` | NEW | Breakpoint-dependent CSS |
| `src/App.tsx` | MODIFY | Responsive header layout |
| `src/pages/Home.tsx` | MODIFY | Edge-zone integration |
| `src/pages/PoolDetail.tsx` | MODIFY | Edge-zone integration |
