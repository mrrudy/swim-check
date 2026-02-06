# Research: Favorites Combined Availability View

**Feature**: 007-favorites-combined-view
**Date**: 2026-02-06

## Overview

This document consolidates research findings to resolve design questions and establish best practices for the combined favorites availability view.

---

## Research Area 1: Component Composition Pattern

### Question
How should we compose existing components to display multiple pools under a single time slot header?

### Decision
Create a new `CombinedSlotSection` component that wraps the existing display components with pool-specific headers.

### Rationale
- `SlotSection.tsx` is designed for a single pool's availability within a slot
- The new component handles the "slot header → multiple pools" grouping
- Each pool within a slot can reuse `CompactAvailabilityBar` or `LaneGrid` directly
- This follows the existing pattern of composition over modification

### Alternatives Considered
1. **Modify SlotSection to accept multiple pools**: Rejected because it would complicate the existing working component and violate single-responsibility
2. **Use MultiSlotView with nested mapping**: Rejected because MultiSlotView is designed for slots-over-time, not pools-within-slot

---

## Research Area 2: Data Fetching Strategy

### Question
How should we fetch availability data for all favorites across multiple slots efficiently?

### Decision
Create a `useCombinedFavoritesData` hook that fetches availability for all favorites in parallel, organized by time slot.

### Rationale
- The existing API supports concurrent calls: `GET /pools/:poolId/availability`
- Browser can handle 6+ concurrent requests per domain (HTTP/2 allows many more)
- Parallel fetching minimizes total load time
- Individual failure handling allows partial results (some pools may fail while others succeed)

### Alternatives Considered
1. **Sequential fetching**: Rejected due to poor performance (N×M requests in series)
2. **Batch API endpoint**: Rejected because it would require backend changes (out of scope)
3. **Client-side caching across pools**: Not needed—browser HTTP cache and existing service cache handle this

### Implementation Pattern
```typescript
// Parallel fetch for all favorites across all forward slots
const fetchAllFavorites = async (favorites, slots) => {
  const requests = favorites.flatMap(favorite =>
    slots.map(slot =>
      api.getPoolAvailability(favorite.pool.id, date, slot.startTime, slot.endTime)
        .then(data => ({ poolId: favorite.pool.id, slot, data }))
        .catch(error => ({ poolId: favorite.pool.id, slot, error }))
    )
  );
  return Promise.all(requests);
};
```

---

## Research Area 3: State Management for Combined View

### Question
Should the combined view share state with the pool detail page or maintain its own?

### Decision
Share state via existing hooks (`useTimeSlotState`, `useViewPreferences`) without modification.

### Rationale
- FR-006 requires: "System MUST share view preferences (compact toggle, slots ahead count) with pool detail page"
- The existing hooks already persist to the backend via API
- No new state management infrastructure needed
- Changes on Home page reflect immediately when navigating to pool detail (and vice versa)

### Alternatives Considered
1. **Separate state per page**: Rejected because spec requires shared preferences
2. **Context provider for shared state**: Not needed—API persistence already provides synchronization

---

## Research Area 4: Layout for Multiple Pools per Slot

### Question
What is the optimal layout for displaying multiple favorite pools under a time slot header?

### Decision
Vertical stacking with pool name + availability on each row.

### Layout Structure (Compact View)
```
┌──────────────────────────────────────┐
│ 13:30 - 14:00                        │  ← Time slot header
├──────────────────────────────────────┤
│ Aquapark Wrocław                     │
│ ████████░░ 6 of 8 available          │  ← CompactAvailabilityBar
├──────────────────────────────────────┤
│ Ślęża Centrum                        │
│ █████░░░░░ 3 of 6 available          │  ← CompactAvailabilityBar
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 14:00 - 14:30                        │  ← Next time slot
├──────────────────────────────────────┤
│ Aquapark Wrocław                     │
│ ███████░░░ 5 of 8 available          │
├──────────────────────────────────────┤
│ Ślęża Centrum                        │
│ ██████████ 6 of 6 available          │
└──────────────────────────────────────┘
```

### Layout Structure (Detailed View)
```
┌──────────────────────────────────────┐
│ 13:30 - 14:00                        │  ← Time slot header
├──────────────────────────────────────┤
│ Aquapark Wrocław                     │
│ ┌────┬────┬────┬────┬────┬────┐      │
│ │ L1 │ L2 │ L3 │ L4 │ L5 │ L6 │      │  ← LaneGrid
│ │ ✓  │ ✓  │ ✓  │ ✓  │ ✗  │ ✗  │      │
│ └────┴────┴────┴────┴────┴────┘      │
├──────────────────────────────────────┤
│ Ślęża Centrum                        │
│ ┌────┬────┬────┬────┐                │
│ │ L1 │ L2 │ L3 │ L4 │                │  ← LaneGrid
│ │ ✓  │ ✗  │ ✓  │ ✓  │                │
│ └────┴────┴────┴────┘                │
└──────────────────────────────────────┘
```

### Rationale
- Vertical stacking handles any number of pools naturally (scrollable)
- Each pool gets its own row for clear visual separation
- Pool name prominently displayed for identification
- Consistent with existing pool detail page patterns

### Alternatives Considered
1. **Horizontal grid of pools**: Rejected due to limited horizontal space on mobile
2. **Tabs per pool within slot**: Rejected because it hides availability comparison
3. **Accordion per pool**: Rejected because it adds unnecessary interaction

---

## Research Area 5: Empty and Error States

### Question
How should the combined view handle various edge cases?

### Decision
Follow existing patterns with pool-specific error/empty handling.

### Edge Cases & Handling

| Scenario | Behavior |
|----------|----------|
| No favorites | Show existing empty state with prompt to add favorites |
| Single favorite | Display normally—combined view works with 1 pool |
| One pool has no data | Show "Data unavailable" for that pool; others display normally |
| All pools no data | Show slot header with "No availability data for any pools" |
| API error for one pool | Show error message for that pool; others display normally |
| API error for all pools | Show error state with retry option |
| Many favorites (20+) | Vertical scroll; no pagination needed per spec |

### Rationale
- Partial failure handling maintains usability when some data is available
- Per-pool error states give users actionable information
- Matches the graceful degradation requirement from spec

---

## Research Area 6: Keyboard Navigation Compatibility

### Question
Will existing keyboard navigation work with the combined view?

### Decision
Yes—reuse `useSlotNavigation` hook without modification.

### Rationale
- The hook is stateless and controlled
- It operates on time slot state, not on pool-specific data
- Arrow keys shift the base time slot, affecting all pools simultaneously
- Keyboard hints component can be reused as-is

### Implementation
```typescript
// In Home.tsx combined view
const navigation = useSlotNavigation({
  currentSlot: timeSlotState,
  onNavigate: timeSlotState.setters.navigate,
  hasFocus: true,
});

// Wrap combined view in focusable container
<div tabIndex={0} onKeyDown={navigation.handleKeyDown}>
  {/* CombinedSlotSection components */}
</div>
```

---

## Research Area 7: Data Freshness Display

### Question
Should freshness indicators be per-pool or per-slot in the combined view?

### Decision
Per-pool freshness indicators.

### Rationale
- Different pools may have different scrape times
- Showing pool-specific freshness gives users accurate information
- Follows existing `SlotSection` pattern which shows freshness per availability response
- If all pools are fresh, the indicator could be omitted (as per spec edge case)

### Visual Design
```
┌─────────────────────────────────────────┐
│ 13:30 - 14:00                           │
├─────────────────────────────────────────┤
│ Aquapark Wrocław                  Fresh │  ← Per-pool freshness
│ ████████░░ 6 of 8 available             │
├─────────────────────────────────────────┤
│ Ślęża Centrum                    Cached │  ← Different freshness
│ █████░░░░░ 3 of 6 available             │
└─────────────────────────────────────────┘
```

---

## Research Area 8: Performance Considerations

### Question
How do we ensure acceptable performance with many favorites and slots?

### Decision
Parallel fetching with per-pool loading states; no virtualization needed for MVP.

### Rationale
- Spec allows up to 10 slots × 20 pools = 200 cells maximum
- Modern browsers handle 200 DOM elements easily
- Parallel API calls reduce total load time vs. sequential
- Per-pool loading states give immediate feedback

### Performance Targets (from spec)
| Metric | Target | How Achieved |
|--------|--------|--------------|
| Page load with 2+ favorites | < 5 seconds | Parallel API calls |
| Navigation between slots | < 2 seconds | State update + parallel refetch |
| View preference toggle | < 200ms | Optimistic UI, no API wait |
| 10+ favorites display | No layout issues | Vertical scroll, simple flex layout |

### Future Optimization (if needed)
- Virtualization with `react-window` for 50+ favorites
- Request batching API endpoint
- Service worker caching

---

## Summary: Resolved Clarifications

All technical questions resolved. No NEEDS CLARIFICATION items remain.

| Topic | Resolution |
|-------|------------|
| Component composition | New `CombinedSlotSection` wrapping existing components |
| Data fetching | Parallel API calls via `useCombinedFavoritesData` hook |
| State management | Reuse existing hooks unchanged |
| Layout | Vertical stacking with pool name + availability per row |
| Edge cases | Per-pool error/empty handling with graceful degradation |
| Keyboard navigation | Reuse `useSlotNavigation` unchanged |
| Data freshness | Per-pool indicators |
| Performance | Parallel fetch, no virtualization for MVP |
