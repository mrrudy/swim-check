# Feature Specification: Favorites Combined Availability View

**Feature Branch**: `007-favorites-combined-view`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Favorites shows a combined availability view of all favorites pools, slot by slot e.g. base slot is 13:30-14:00, user has 2 swimming pools added as favorite, compact view is chosen and slots ahead is 2 the application should show 13:30-14:00 header; swimming pool 1: 6 of 8 available; % bar; swimming pool 2: 3 of 6 available; % bar;; 14:00-14:30 header; swimming pool 1: 5 of 8 available; % bar; swimming pool 2: 6 of 6 available; % bar;; The navigation and switch to Compact/Detailed view should work similarly, showing multiple rows for swimming pool grouped by time slots."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combined Availability View for Favorites (Priority: P1)

A user with multiple favorite pools wants to see lane availability across all their favorites at once, organized by time slot. Instead of navigating to each pool individually, they can view all favorite pools grouped under each time slot header, allowing quick comparison of availability across pools for the same time period.

**Why this priority**: This is the core value proposition - enabling users to compare availability across multiple pools simultaneously saves time and helps them find the best option for their desired time slot.

**Independent Test**: Can be fully tested by adding 2+ pools to favorites, viewing the home page, and verifying that availability data appears grouped by time slot with all favorite pools listed under each slot.

**Acceptance Scenarios**:

1. **Given** a user has 2 favorite pools and current time slot is 13:30-14:00, **When** viewing the favorites page, **Then** the page displays a "13:30 - 14:00" header followed by availability for both pools (e.g., "Pool A: 6 of 8 available", "Pool B: 3 of 6 available").

2. **Given** a user has 3 favorite pools, **When** viewing combined availability, **Then** all 3 pools appear under each time slot header in the user's preferred display order.

3. **Given** a user has no favorite pools, **When** viewing the favorites page, **Then** the existing empty state is shown prompting them to add favorites.

4. **Given** a user has 1 favorite pool, **When** viewing combined availability, **Then** the single pool is displayed under each time slot header (feature works with single favorite).

---

### User Story 2 - Multi-Slot Forward View for Favorites (Priority: P2)

A user wants to see availability for multiple consecutive time slots across all their favorite pools. Using the "slots ahead" setting, they can view N time slots simultaneously, with each slot section showing all favorite pools.

**Why this priority**: Extends the core comparison feature to allow planning ahead, essential for users deciding between pools based on upcoming availability patterns.

**Independent Test**: Can be tested by setting slots ahead to 2, verifying two time slot sections appear with all favorites under each.

**Acceptance Scenarios**:

1. **Given** slots ahead is set to 2 and current slot is 13:30-14:00, **When** viewing favorites combined view, **Then** two sections appear: "13:30 - 14:00" with all favorite pools, followed by "14:00 - 14:30" with all favorite pools.

2. **Given** slots ahead is set to 1, **When** viewing favorites combined view, **Then** only the current time slot section appears with all favorite pools.

3. **Given** slots ahead is set to 5, **When** approaching pool closing time, **Then** only available slots within operating hours are displayed.

---

### User Story 3 - Compact and Detailed View Toggle (Priority: P2)

A user can switch between compact view (percentage bars) and detailed view (individual lane cards) for the combined favorites display, applying the same preference consistently across all pools in the view.

**Why this priority**: Consistency with existing pool detail page view preferences provides familiar interaction patterns and accommodates different user preferences for data density.

**Independent Test**: Can be tested by toggling between compact and detailed views and verifying all pools in all slots update accordingly.

**Acceptance Scenarios**:

1. **Given** compact view is enabled, **When** viewing favorites combined view, **Then** each pool shows a single percentage bar with "X of Y available" text and color-coded fill.

2. **Given** detailed view is enabled, **When** viewing favorites combined view, **Then** each pool shows individual lane cards (as currently displayed on pool detail page).

3. **Given** user toggles view preference on favorites page, **When** navigating to individual pool detail, **Then** the same preference is applied (shared setting).

---

### User Story 4 - Time Slot Navigation (Priority: P3)

A user can navigate between time slots using the existing navigation controls (previous/next buttons and arrow keys) while viewing the combined favorites view.

**Why this priority**: Reuses existing navigation patterns from pool detail page, providing consistency and keyboard accessibility.

**Independent Test**: Can be tested by clicking navigation buttons or pressing arrow keys and verifying the time slot shifts for all displayed pools.

**Acceptance Scenarios**:

1. **Given** current slot is 14:00-14:30, **When** user clicks "Previous" or presses left arrow, **Then** the view shifts to show slots starting from 13:30-14:00, with updated availability for all pools.

2. **Given** current slot is 14:00-14:30, **When** user clicks "Next" or presses right arrow, **Then** the view shifts to show slots starting from 14:30-15:00, with updated availability for all pools.

3. **Given** current slot is at the first available slot of the day, **When** user attempts to navigate earlier, **Then** navigation is blocked with visual feedback.

---

### User Story 5 - Duration Adjustment (Priority: P3)

A user can adjust the slot duration using up/down arrow keys or extend/reduce buttons, with the change applying to all pools in the combined view.

**Why this priority**: Completes the navigation feature set, allowing users to view longer booking windows across all favorites.

**Independent Test**: Can be tested by pressing up/down arrows and verifying duration changes for all displayed slots.

**Acceptance Scenarios**:

1. **Given** current duration is 30 minutes, **When** user extends duration, **Then** all pools show availability for 60-minute slots.

2. **Given** current duration is 60 minutes, **When** user reduces duration, **Then** all pools show availability for 30-minute slots.

---

### Edge Cases

- What happens when one favorite pool has no data for a slot? Display "Data unavailable" message for that pool under the slot, while other pools display normally.
- What happens when all pools have no data for a slot? Display the slot header with "No availability data for any pools" message.
- How does the system handle a large number of favorites (e.g., 20 pools)? Display all pools in order with vertical scrolling; no pagination needed.
- What happens if data freshness differs across pools? Show individual freshness indicators per pool (or omit if all are fresh).
- How does drag-to-reorder interact with combined view? Reordering favorites updates the display order in the combined view in real-time.
- What happens when a user removes a pool from favorites while viewing combined view? The pool is removed from all time slot sections immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display combined availability view on the favorites/home page when user has at least one favorite pool.
- **FR-002**: System MUST group pools by time slot, showing a time slot header (e.g., "13:30 - 14:00") followed by availability for each favorite pool.
- **FR-003**: System MUST display pools in the user's preferred order (as set by drag-to-reorder on favorites list).
- **FR-004**: System MUST support "slots ahead" setting to show multiple consecutive time slots, each with all favorite pools.
- **FR-005**: System MUST provide toggle between compact view (percentage bars) and detailed view (lane cards).
- **FR-006**: System MUST share view preferences (compact toggle, slots ahead count) with pool detail page via existing preference storage.
- **FR-007**: System MUST provide navigation buttons (previous/next) to shift the base time slot for all pools.
- **FR-008**: System MUST support keyboard navigation (left/right arrows for slot navigation, up/down for duration).
- **FR-009**: System MUST display loading states while fetching availability data for multiple pools.
- **FR-010**: System MUST handle mixed data states gracefully (some pools have data, some don't).
- **FR-011**: System MUST update display when favorites are reordered, added, or removed.
- **FR-012**: System MUST apply time slot picker (date/time selection) to all pools in the combined view.

### Key Entities

- **CombinedSlotView**: A time slot section containing availability summaries for all favorite pools.
- **FavoritePoolAvailability**: Availability data for a single pool within a time slot (available count, total count, lanes array, freshness).
- **ViewPreferences**: Shared settings for compact mode toggle and forward slot count (existing entity).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can compare availability across 2+ favorite pools within 5 seconds of page load.
- **SC-002**: Users can view up to 10 consecutive time slots for all favorites simultaneously.
- **SC-003**: 90% of users can successfully navigate time slots using keyboard or buttons without guidance.
- **SC-004**: View preference changes (compact/detailed toggle) apply to all pools within 200ms.
- **SC-005**: Navigation between slots updates all pool availability within 2 seconds.
- **SC-006**: Users with 10+ favorites can view combined availability without significant layout issues or performance degradation.

## Assumptions

- Favorites functionality already exists with add/remove and reorder capabilities.
- View preferences (compact toggle, slots ahead) are already persisted and shared across the application.
- Pool availability API can be called for multiple pools concurrently.
- Time slot duration follows 30-minute increments as established in existing features.
- The home page layout can accommodate the combined view without major structural changes.
- Data freshness indicators follow the same patterns as pool detail page (fresh, cached, stale, unavailable).
