# Feature Specification: Pool View Display Options

**Feature Branch**: `005-pool-view-options`
**Created**: 2026-02-02
**Status**: Draft
**Input**: User description: "Frontend pool view with compact lane percentage bar and multi-slot forward view options"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact Lane Availability View (Priority: P1)

A user viewing a pool wants to quickly assess lane availability at a glance without needing to count individual lane cards. Instead of seeing separate cards for each lane, they see a single horizontal progress bar showing "X of Y available" with the bar filled proportionally and color-coded based on availability percentage.

**Why this priority**: This is the primary visual improvement - it provides immediate visual feedback on pool busyness without cognitive load of counting lanes. Most valuable for quick decision-making.

**Independent Test**: Can be fully tested by toggling compact view on any pool detail page and verifying the bar displays correct counts and colors.

**Acceptance Scenarios**:

1. **Given** compact view is enabled and a pool has 6 lanes with all 6 available, **When** viewing the pool, **Then** the bar shows "6 of 6 available", is 100% filled, and displays green color.

2. **Given** compact view is enabled and a pool has 6 lanes with 3 available, **When** viewing the pool, **Then** the bar shows "3 of 6 available", is 50% filled, and displays amber/yellow color.

3. **Given** compact view is enabled and a pool has 6 lanes with 1 available, **When** viewing the pool, **Then** the bar shows "1 of 6 available", is ~17% filled, and displays red color.

4. **Given** compact view is enabled and a pool has 6 lanes with 0 available, **When** viewing the pool, **Then** the bar shows "0 of 6 available", is 0% filled (empty), and displays black/dark color.

5. **Given** compact view is disabled, **When** viewing the pool, **Then** the original individual lane card grid is displayed.

---

### User Story 2 - Multi-Slot Forward View (Priority: P2)

A user wants to see availability not just for the current time slot but also for subsequent time slots to plan their visit. They can configure how many consecutive slots to display (1-N), and each slot appears stacked vertically with a clear header showing the time range.

**Why this priority**: Extends utility by showing future availability, enabling better planning. Builds on the existing slot navigation but displays multiple slots simultaneously.

**Independent Test**: Can be fully tested by setting forward view count to 3 and verifying three consecutive time slots are displayed with correct headers and availability data.

**Acceptance Scenarios**:

1. **Given** forward view is set to 1 slot and current slot is 8:00-8:30, **When** viewing the pool, **Then** only one slot is displayed showing "8:00 - 8:30" header with lane availability.

2. **Given** forward view is set to 3 slots and current slot is 8:00-8:30, **When** viewing the pool, **Then** three slots are displayed stacked vertically: "8:00 - 8:30", "8:30 - 9:00", and "9:00 - 9:30", each with their own lane availability.

3. **Given** forward view is set to 5 slots and current slot is 23:00-23:30, **When** viewing the pool approaching midnight, **Then** slots that would cross into the next day are handled gracefully (either showing next day's slots or stopping at day boundary).

4. **Given** forward view is enabled with multiple slots, **When** data for a future slot is unavailable, **Then** that slot displays a "No data available" state without breaking other slots.

---

### User Story 3 - View Options Persistence (Priority: P3)

A user's view preferences (compact view toggle and forward slot count) persist across sessions so they don't need to reconfigure each visit.

**Why this priority**: Quality-of-life improvement that enhances user experience but is not essential for core functionality.

**Independent Test**: Can be tested by configuring view options, closing the browser, returning to the app, and verifying settings are restored.

**Acceptance Scenarios**:

1. **Given** a user enables compact view and sets forward slots to 3, **When** they close and reopen the application, **Then** their preferences are restored automatically.

2. **Given** a user has never configured preferences, **When** viewing a pool for the first time, **Then** default settings are applied (compact view enabled, forward slots = 1).

---

### User Story 4 - Combined View Options (Priority: P3)

Users can use compact view and forward view simultaneously, seeing multiple time slots each displayed as a compact percentage bar.

**Why this priority**: Combines both features for power users but requires both P1 and P2 to be implemented first.

**Independent Test**: Enable both compact view and forward view set to 3, verify three compact bars are displayed with appropriate headers.

**Acceptance Scenarios**:

1. **Given** both compact view is enabled and forward view is set to 3, **When** viewing a pool starting at 10:00-10:30, **Then** three consecutive time slots are displayed, each showing a compact percentage bar with time headers "10:00 - 10:30", "10:30 - 11:00", "11:00 - 11:30".

---

### Edge Cases

- What happens when compact view is enabled but the pool has 0 lanes in the data? Display empty state message.
- What happens when forward view requests slots beyond pool operating hours? Show available slots only; hide or disable slots outside operating hours.
- What happens when forward view is set to a very high number (e.g., 100)? Apply a reasonable maximum limit (e.g., 10 slots).
- How does system handle rapid toggling of view options? Options should update immediately without flickering or delay.
- What happens if lane availability data is still loading? Show loading state for affected slots while preserving already-loaded data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a toggle to enable/disable compact view mode, defaulting to enabled.
- **FR-002**: System MUST display lane availability as a single horizontal bar in compact mode showing "X of Y available" text centered within or adjacent to the bar.
- **FR-003**: System MUST fill the compact bar proportionally to the percentage of available lanes (e.g., 50% available = 50% bar fill).
- **FR-004**: System MUST color-code the compact bar based on availability percentage with smooth color transitions:
  - 100% available: Green
  - ~50% available: Amber/Yellow
  - ~17% (1 of 6) or less but not zero: Red
  - 0% available: Black/Dark gray
  - Colors MUST interpolate smoothly between thresholds (e.g., 75% shows yellow-green blend)
- **FR-005**: System MUST provide a configurable setting for number of forward slots to display (minimum 1).
- **FR-006**: System MUST display each forward slot stacked vertically with a clear header showing the time range (e.g., "8:00 - 8:30").
- **FR-007**: System MUST fetch and display lane availability data for each forward slot independently.
- **FR-008**: System MUST persist view preferences (compact toggle, forward slot count) in user storage.
- **FR-009**: System MUST apply default settings (compact enabled, 1 forward slot) for new users.
- **FR-010**: System MUST enforce a maximum limit on forward slots to prevent performance issues.
- **FR-011**: System MUST preserve the existing detailed lane card view when compact mode is disabled.
- **FR-012**: System MUST allow both view options to be used simultaneously (compact bars for multiple slots).

### Key Entities

- **ViewPreferences**: User's display settings including compact mode toggle (boolean) and forward slot count (integer).
- **TimeSlot**: A time range (start/end) with associated lane availability data for a specific pool.
- **AvailabilitySummary**: Aggregated data showing available count, total count, and percentage for a time slot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can assess pool availability within 2 seconds of page load using compact view (vs. counting individual lanes).
- **SC-002**: Users can view up to 10 consecutive time slots simultaneously using forward view.
- **SC-003**: 95% of users can correctly interpret availability level from the color-coded bar without additional explanation.
- **SC-004**: View preference changes persist with 100% reliability across browser sessions.
- **SC-005**: Both view options (compact and forward) work together without visual conflicts or layout issues.
- **SC-006**: Toggling view options updates the display within 200ms for already-loaded data.

## Assumptions

- Pool time slots follow consistent 30-minute intervals (based on existing implementation).
- User preferences storage mechanism already exists (based on existing duration preference storage).
- Lane availability data for future slots can be fetched using the same mechanism as current slot data.
- The maximum forward slot limit of 10 provides a reasonable balance between utility and performance.
- Color interpolation between thresholds uses a standard color gradient approach (e.g., HSL interpolation).
- Operating hours for pools are implicitly handled by the backend returning no data for closed periods.
