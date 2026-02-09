# Quickstart: Mobile UI Refinements

**Feature**: 009-mobile-ui-refinements | **Branch**: `009-mobile-ui-refinements`

## Prerequisites

- Node.js 20 LTS
- pnpm (monorepo package manager)

## Setup

```bash
git checkout 009-mobile-ui-refinements
cd packages/frontend
pnpm install
pnpm dev
```

## Testing Mobile Layout

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set viewport to 375px wide (iPhone SE equivalent)
4. Navigate to a pool detail page

## What to Verify

### 1. Slot Navigation Box Hidden
- On mobile (<800px): The Prev/Next/+30m/-30m button box should not appear
- On desktop (≥800px): Button box appears as before

### 2. Edge Zone Hints
- Load a pool detail page with data
- Wait 3 seconds after data appears
- Semi-transparent arrows (◀ ▶ ▲ ▼) should fade in at the edges of the grid
- Arrows should only appear for enabled navigation directions

### 3. Refresh Button Position
- On mobile: Refresh button and cache info appear BELOW the availability grid
- On desktop: Refresh button remains ABOVE the data (unchanged)

### 4. Time Inputs in Single Row
- On mobile: Date, Start Time, End Time remain on one horizontal line
- Inputs shrink proportionally as viewport narrows
- Below ~280px: inputs wrap gracefully (no horizontal scrollbar)

## Running Tests

```bash
cd packages/frontend
pnpm test
```

## Key Files

| File | Change |
|------|--------|
| `src/responsive.css` | CSS rules for hiding nav, reordering, input sizing |
| `src/components/EdgeZoneOverlay.tsx` | Hint timer state and hint rendering |
| `src/pages/PoolDetail.tsx` | CSS class additions for flexbox ordering |
| `src/pages/Home.tsx` | CSS class additions (if slot nav present) |
