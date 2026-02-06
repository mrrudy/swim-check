# Research: Pool View Display Options

**Feature Branch**: `005-pool-view-options`
**Date**: 2026-02-02

## Research Tasks

### 1. Color Interpolation for Availability Bar

**Context**: FR-004 requires smooth color transitions between availability thresholds (100% green → ~50% amber → <20% red → 0% black).

**Decision**: Use HSL color space interpolation

**Rationale**:
- HSL (Hue, Saturation, Lightness) produces perceptually smooth gradients
- Green (120°) → Yellow (60°) → Red (0°) follows natural hue progression
- More visually intuitive than RGB interpolation which can produce muddy intermediate colors
- Easy to implement in JavaScript without external dependencies

**Implementation Approach**:
```typescript
// Color stops defined in HSL:
// 100% available: hsl(120, 65%, 40%) - Green
// 50% available:  hsl(45, 85%, 50%)  - Amber/Yellow
// 20% available:  hsl(0, 70%, 50%)   - Red
// 0% available:   hsl(0, 0%, 25%)    - Dark gray/black
```

**Alternatives Considered**:
1. **RGB interpolation**: Rejected - produces brownish midpoints
2. **CSS gradients**: Rejected - requires DOM manipulation for dynamic values
3. **Pre-computed color array**: Rejected - less flexibility, larger code footprint

---

### 2. Multi-Slot Data Fetching Strategy

**Context**: Forward view feature needs to display up to 10 consecutive time slots simultaneously.

**Decision**: Parallel API calls with Promise.all() and individual slot loading states

**Rationale**:
- Existing `getPoolAvailability()` API is slot-specific and well-tested
- Parallel fetching minimizes total wait time (all slots load in parallel)
- Individual loading states allow progressive rendering
- No backend changes required (follows Simplicity principle)

**Implementation Approach**:
```typescript
// Generate slot times, then fetch all in parallel
const slotPromises = forwardSlots.map(slot =>
  api.getPoolAvailability(poolId, date, slot.start, slot.end)
);
const results = await Promise.allSettled(slotPromises);
```

**Alternatives Considered**:
1. **New batch API endpoint**: Rejected - requires backend changes, more complexity
2. **Sequential fetching**: Rejected - poor UX, total time = N × single slot time
3. **GraphQL query**: Rejected - project uses REST, would add major dependency

---

### 3. View Preferences Storage

**Context**: FR-008 requires persistence of view preferences across sessions.

**Decision**: Extend existing `/api/v1/preferences` endpoint with new fields

**Rationale**:
- Existing preferences infrastructure already handles `slotDurationMins`
- Database schema likely supports additional columns (SQLite flexibility)
- Consistent pattern with existing duration preference
- Single source of truth for user preferences

**Implementation Approach**:
- Extend `UpdatePreferencesRequest` with `compactViewEnabled?: boolean` and `forwardSlotCount?: number`
- Extend `UserPreferencesResponse` with same fields
- Backend changes minimal (add columns, update handlers)

**Alternatives Considered**:
1. **localStorage**: Rejected - doesn't persist across devices/browsers
2. **Separate preferences endpoint**: Rejected - unnecessary complexity
3. **URL parameters**: Rejected - doesn't persist, pollutes URLs

**Note**: After reviewing the spec assumption ("User preferences storage mechanism already exists") and the API, minimal backend changes ARE required to add the new preference fields. This is acceptable as it extends existing infrastructure rather than creating new patterns.

---

### 4. Component Architecture

**Context**: Need to integrate compact view and multi-slot view into existing PoolDetail page.

**Decision**: Create isolated presentational components with container pattern in PoolDetail

**Rationale**:
- Follows existing codebase pattern (LaneGrid is a presentational component)
- Enables independent testing of each component
- PoolDetail remains the "smart" component managing state and API calls
- Easy to toggle between views without affecting each other

**Component Hierarchy**:
```
PoolDetail (container - manages state)
├── ViewPreferencesPanel (controls for compact/forward settings)
├── MultiSlotView (container for multiple slots)
│   └── SlotSection (single slot with header)
│       ├── CompactAvailabilityBar (compact mode)
│       └── LaneGrid (detailed mode - existing)
```

**Alternatives Considered**:
1. **Single mega-component**: Rejected - poor testability, violates single responsibility
2. **Context-based state**: Rejected - overkill for single-page feature
3. **Render props pattern**: Rejected - unnecessary indirection for this use case

---

### 5. Forward Slot Boundary Handling

**Context**: Edge case in User Story 2, Scenario 3 - what happens when forward view crosses midnight?

**Decision**: Stop at day boundary (22:00 pool closing)

**Rationale**:
- Pool operating hours end at 22:00 per `SLOT_CONSTANTS.LAST_SLOT`
- Next day's data requires different date parameter
- Simpler UX to show "No more slots today" rather than jump to next day
- Consistent with existing single-slot behavior

**Implementation Approach**:
```typescript
// Calculate available forward slots from current time
const availableSlots = Math.min(
  requestedForwardSlots,
  calculateSlotsUntilClosing(currentStartTime)
);
```

**Alternatives Considered**:
1. **Cross-day fetching**: Rejected - complex date handling, confusing UX
2. **Disable forward view near closing**: Rejected - poor UX, loses functionality
3. **Show placeholder for unavailable slots**: Acceptable alternative, but adds noise

---

### 6. Default Values

**Context**: FR-009 requires sensible defaults for new users.

**Decision**: Compact view enabled by default, forward slot count = 1

**Rationale**:
- Compact view provides quick glance capability (matches P1 story intent)
- Single forward slot matches current behavior (no change for existing users)
- Users can opt into multi-slot view progressively
- Matches spec explicitly: "default settings are applied (compact view enabled, forward slots = 1)"

---

### 7. Maximum Forward Slot Limit

**Context**: FR-010 requires maximum limit on forward slots to prevent performance issues.

**Decision**: Maximum 10 slots (as stated in spec assumption)

**Rationale**:
- 10 slots × 30 mins = 5 hours of visibility, sufficient for planning
- 10 parallel API calls is reasonable for browser/network
- Matches spec assumption: "maximum forward slot limit of 10"
- UI can accommodate 10 stacked rows without excessive scrolling

---

## Summary of Technical Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| Color interpolation | HSL color space | Perceptually smooth gradients |
| Multi-slot fetching | Parallel API calls | No backend changes, fast loading |
| Preferences storage | Extend existing API | Consistent pattern |
| Component structure | Isolated presentational | Testable, follows codebase pattern |
| Day boundary | Stop at 22:00 | Simple UX, matches pool hours |
| Defaults | Compact=true, slots=1 | Per spec, non-disruptive |
| Max slots | 10 | Per spec, reasonable limit |

All research questions resolved. Ready for Phase 1 design.
