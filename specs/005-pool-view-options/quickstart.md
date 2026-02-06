# Quickstart: Pool View Display Options

**Feature Branch**: `005-pool-view-options`
**Date**: 2026-02-02

## Overview

This feature adds two display options to the pool detail view:
1. **Compact View**: Shows lane availability as a color-coded percentage bar
2. **Multi-Slot View**: Displays multiple consecutive time slots stacked vertically

## Prerequisites

- Node.js 20 LTS
- Existing swim-check monorepo cloned
- Backend running (`npm run dev` in packages/backend)

## Development Setup

```bash
# Navigate to frontend package
cd packages/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Frontend runs at http://localhost:5173

## Key Files to Modify/Create

### New Files

| File | Purpose |
|------|---------|
| `src/components/CompactAvailabilityBar.tsx` | Percentage bar component |
| `src/components/CompactAvailabilityBar.test.tsx` | Tests for compact bar |
| `src/components/MultiSlotView.tsx` | Multi-slot container |
| `src/components/MultiSlotView.test.tsx` | Tests for multi-slot |
| `src/components/ViewPreferencesPanel.tsx` | Settings controls |
| `src/components/ViewPreferencesPanel.test.tsx` | Tests for settings |
| `src/hooks/useViewPreferences.ts` | Preferences state hook |
| `src/hooks/useViewPreferences.test.ts` | Tests for hook |
| `src/utils/colorUtils.ts` | Color interpolation |
| `src/utils/colorUtils.test.ts` | Tests for color utils |

### Files to Modify

| File | Changes |
|------|---------|
| `packages/shared/src/types/api.ts` | Add view preference types |
| `packages/frontend/src/services/api.ts` | Extend updatePreferences |
| `packages/frontend/src/pages/PoolDetail.tsx` | Integrate new components |
| `packages/backend/src/services/preferences.ts` | Handle new fields |
| `packages/backend/src/db/migrations/` | Add new columns |

## Running Tests

```bash
# Run all frontend tests
npm test

# Run specific test file
npm test -- CompactAvailabilityBar

# Run tests in watch mode
npm test -- --watch
```

## Testing Checklist

### Compact View (P1)

- [ ] Toggle shows/hides compact bar
- [ ] Bar displays "X of Y available" text
- [ ] Bar fill percentage matches availability
- [ ] Color is green at 100%
- [ ] Color is amber at 50%
- [ ] Color is red at <20%
- [ ] Color is black/dark at 0%
- [ ] Colors interpolate smoothly

### Multi-Slot View (P2)

- [ ] Single slot shows one section
- [ ] Multiple slots stack vertically
- [ ] Each slot has time header
- [ ] Slots load independently
- [ ] Error states display correctly
- [ ] Max 10 slots enforced

### Persistence (P3)

- [ ] Preferences save on change
- [ ] Preferences restore on reload
- [ ] Defaults apply for new users

## Color Reference

| Availability | HSL Color | Hex Equivalent |
|-------------|-----------|----------------|
| 100% | hsl(120, 65%, 40%) | #23A623 (Green) |
| 50% | hsl(45, 85%, 50%) | #ECAD0F (Amber) |
| 20% | hsl(0, 70%, 50%) | #D93636 (Red) |
| 0% | hsl(0, 0%, 25%) | #404040 (Dark) |

## API Integration

### Get Preferences

```typescript
const prefs = await api.getPreferences();
// Returns: { compactViewEnabled: true, forwardSlotCount: 1, ... }
```

### Update Preferences

```typescript
await api.updatePreferences({
  compactViewEnabled: true,
  forwardSlotCount: 3
});
```

### Fetch Multiple Slots

```typescript
const slots = generateForwardSlots(startTime, duration, forwardSlotCount);
const results = await Promise.all(
  slots.map(slot =>
    api.getPoolAvailability(poolId, date, slot.startTime, slot.endTime)
  )
);
```

## Troubleshooting

### "No lane data available"
- Check backend is running
- Verify pool has scraped data
- Check network requests in DevTools

### Colors not interpolating
- Verify percentage calculation (should be 0-1)
- Check HSL values in colorUtils.ts

### Preferences not saving
- Check backend console for errors
- Verify PATCH request in network tab
- Check database has new columns
