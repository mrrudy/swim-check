# Feature Specification: Mobile UI Refinements

**Feature Branch**: `009-mobile-ui-refinements`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Related to 008-responsive-mobile-ui. On small screens: completely hide the slot navigation box, move refresh button and cache age info to the bottom, make edge navigation zones visible (transparent) with a 3-second delayed appearance after data loads, and keep date/start time/end time inputs in a single row instead of stacking vertically."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide Slot Navigation Box on Small Screens (Priority: P1)

As a mobile user, I want the slot navigation buttons box (Prev/Next, -30m/+30m controls) to be completely hidden on small screens, so that the limited screen space is dedicated to showing actual pool availability data rather than redundant navigation controls (since edge zones already provide the same navigation functionality).

**Why this priority**: The slot navigation box is the largest single block of wasted space on mobile. It duplicates functionality already provided by the edge-zone overlay, so removing it on small screens immediately reclaims significant vertical real estate with no loss of functionality.

**Independent Test**: Can be fully tested by resizing the browser to below the mobile breakpoint and verifying the slot navigation buttons box is no longer visible, while confirming edge-zone navigation still works.

**Acceptance Scenarios**:

1. **Given** the app is displayed on a screen narrower than 800px, **When** the pool detail page loads, **Then** the slot navigation buttons box (containing Prev/Next buttons, -30m/+30m buttons, start time, duration, and end time displays) is not visible.
2. **Given** the slot navigation box is hidden on a small screen, **When** the user interacts with edge zones (left, right, top, bottom of the slot grid), **Then** slot navigation still functions correctly (Previous, Next, +30m, -30m).
3. **Given** the app is displayed on a screen wider than 800px, **When** the pool detail page loads, **Then** the slot navigation buttons box is displayed as before.
4. **Given** the slot navigation box is hidden on mobile, **When** the user uses keyboard arrow keys (if a physical keyboard is connected), **Then** keyboard navigation still functions correctly.

---

### User Story 2 - Edge Zone Visibility Hint (Priority: P1)

As a user unfamiliar with the app, I want to see a visual hint showing that edge navigation zones exist, so I can discover the swipe/tap navigation feature without prior knowledge of the app. The hints appear with a delay so they don't distract from the initial data display.

**Why this priority**: Without a visual hint, new users have no way to discover the edge navigation zones. This is critical for usability since on mobile the slot navigation buttons box is hidden and the edge zones become the primary navigation method.

**Independent Test**: Can be fully tested by loading a pool detail page and waiting 3 seconds after data appears, then verifying that subtle visual indicators appear at the edges of the slot grid area.

**Acceptance Scenarios**:

1. **Given** the pool detail page has loaded and availability data is displayed, **When** 3 seconds elapse after the data first appears, **Then** subtle semi-transparent visual indicators (such as arrow icons or gradient overlays) become visible at each active edge zone (left, right, top, bottom).
2. **Given** edge zone hints are visible, **When** the user looks at the slot grid area, **Then** the indicators are unobtrusive (low opacity, not covering significant content area) yet recognizable as directional navigation affordances.
3. **Given** an edge zone's corresponding action is at its boundary (e.g., already at the first slot so "Previous" is disabled), **When** hints appear, **Then** the indicator for that disabled edge zone is not shown.
4. **Given** edge zone hints are visible, **When** the user taps an edge zone, **Then** the normal edge-zone flash feedback plays as before (the hints do not interfere with existing interactions).
5. **Given** the page has just loaded and data is still being fetched, **When** the data has not yet appeared, **Then** no edge zone hints are visible (the 3-second timer starts only after data is displayed).

---

### User Story 3 - Move Refresh Button and Cache Info to Bottom (Priority: P2)

As a mobile user, I want the refresh button and cache age information to appear at the bottom of the pool detail page (below the availability data), so that the most valuable content (pool availability) is visible immediately without scrolling past controls.

**Why this priority**: On small screens, every pixel of above-the-fold space matters. Moving the refresh/cache info below the data lets users see availability results sooner. This is slightly less critical than hiding the nav box and adding edge hints, since the refresh area is smaller, but still meaningfully improves mobile content density.

**Independent Test**: Can be fully tested by loading the pool detail page on a mobile-width viewport and verifying the refresh button and cache freshness indicator appear below the lane availability grid.

**Acceptance Scenarios**:

1. **Given** the app is displayed on a screen narrower than 800px, **When** the pool detail page loads with availability data, **Then** the refresh button and cache freshness indicator (colored dot, label, timestamp) appear below the availability data grid instead of above it.
2. **Given** the app is displayed on a screen wider than 800px, **When** the pool detail page loads, **Then** the refresh button and cache freshness indicator remain in their current position (above the data, as they are today).
3. **Given** the refresh button is at the bottom on mobile, **When** the user taps the refresh button, **Then** it functions identically (triggers data refresh, shows "Refreshing..." state, updates cache indicator).
4. **Given** the stale data warning is shown, **When** viewed on a mobile screen, **Then** the stale data warning also moves to the bottom area, near the refresh button.

---

### User Story 4 - Keep Date/Time Inputs in Single Row (Priority: P2)

As a mobile user, I want the date, start time, and end time inputs to remain in a single horizontal row on small screens (instead of stacking vertically), so that the time slot picker is compact and familiar in layout.

**Why this priority**: The current mobile CSS forces these fields to stack vertically, which wastes vertical space and changes the visual structure users are accustomed to. These three fields are narrow enough to fit side-by-side even on small screens if their widths are adjusted.

**Independent Test**: Can be fully tested by resizing the browser to a mobile width and verifying that date, start time, and end time inputs remain on the same row, shrinking as needed.

**Acceptance Scenarios**:

1. **Given** the app is displayed on a screen narrower than 800px, **When** the pool detail page loads, **Then** the date input, start time select, and end time select remain in a single horizontal row.
2. **Given** the three inputs are in a single row on a small screen, **When** the viewport is very narrow (320px), **Then** the inputs shrink their widths proportionally to fit in one row (reducing minimum widths, using abbreviated labels if needed), without any input becoming unusable.
3. **Given** the inputs are in a single row, **When** the viewport becomes extremely narrow and the inputs physically cannot fit (below approximately 280px), **Then** the inputs gracefully wrap to the next line rather than overflowing or causing a horizontal scrollbar.
4. **Given** the duration display currently shown below the time fields, **When** on a small screen, **Then** the duration display remains visible (either inline or below the row), and does not force the inputs to a second row.

---

### Edge Cases

- What happens when a user loads the page on a small screen for the first time and has no knowledge of edge zones? The 3-second delayed hints provide discoverability. Once the user taps an edge zone, the existing flash feedback confirms the action.
- What happens if the data fetch takes longer than 3 seconds? The edge zone hint timer does not start until data is actually displayed, so slow loads do not cause hints to flash prematurely over a loading state.
- What happens if the user rotates from portrait to landscape while the hint timer is active? The hints should recalculate position based on the new layout dimensions. If the screen becomes wide enough that the slot navigation box is now visible, the hints are less critical but still appropriate since edge zones work on all screen sizes.
- What happens when the viewport is exactly at the 800px breakpoint? The desktop layout is shown at and above 800px; mobile refinements apply below 800px (consistent with the existing 008 breakpoint).
- What happens when the time inputs have very long locale-formatted dates? The inputs use native browser controls that handle truncation/scrolling internally, so the single-row layout remains intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The slot navigation buttons box MUST be completely hidden (display: none or equivalent) on viewports narrower than 800px.
- **FR-002**: Hiding the slot navigation buttons box MUST NOT affect edge-zone overlay navigation or keyboard navigation functionality.
- **FR-003**: Edge zone indicators (semi-transparent directional hints) MUST become visible 3 seconds after availability data is first displayed on the page.
- **FR-004**: Edge zone hint indicators MUST be unobtrusive—using low opacity (approximately 20-30% opacity) so they do not obscure the underlying data.
- **FR-005**: Edge zone hints MUST only appear for zones where the corresponding navigation action is currently enabled (not at navigation boundaries).
- **FR-006**: Edge zone hints MUST NOT interfere with existing edge-zone tap/click interactions or the flash animation feedback.
- **FR-007**: On viewports narrower than 800px, the refresh button and cache freshness information MUST be positioned below the availability data grid.
- **FR-008**: On viewports 800px and wider, the refresh button and cache freshness information MUST remain in their current position (above the data grid).
- **FR-009**: The date, start time, and end time inputs MUST remain in a single horizontal row on viewports narrower than 800px, using reduced minimum widths and flexible sizing to fit.
- **FR-010**: If the viewport is too narrow for the three time inputs to fit in one row (below approximately 280px), they MUST wrap gracefully rather than cause horizontal overflow.
- **FR-011**: All changes in this feature MUST only apply to small-screen layouts (below 800px breakpoint) and MUST NOT alter the desktop layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 375px-wide viewport (standard mobile phone), the pool detail page shows availability data without requiring the user to scroll past navigation controls—the first piece of availability data is visible within the top 300px of the page content area.
- **SC-002**: 100% of new users can discover edge-zone navigation within 10 seconds of data appearing, thanks to the visual hint indicators.
- **SC-003**: The date, start time, and end time inputs fit in a single row on viewports from 320px to 799px wide without causing horizontal scrollbar.
- **SC-004**: The refresh button and cache age information are accessible on mobile viewports without scrolling past the availability data (they appear after the data, not before).
- **SC-005**: Edge zone hint indicators appear exactly 3 seconds (with a tolerance of 500ms) after availability data is first rendered.
- **SC-006**: All existing navigation functionality (edge zones, keyboard arrows, refresh) continues to work identically after these layout changes.

## Assumptions

- The existing 800px breakpoint from feature 008 is reused as the threshold for all mobile-specific refinements in this feature.
- The edge zone visual hints use the same arrow symbols already defined in the EdgeZoneOverlay component (◀, ▶, ▲, ▼) rendered at low opacity, so no new icon assets are needed.
- The 3-second delay for edge zone hints is measured from when the availability data component first mounts with data, not from page navigation or API call start.
- The slot navigation box remains the primary navigation UI on desktop (800px+); it is only hidden on smaller viewports where edge zones serve as the replacement.
- Native browser date and time picker controls are flexible enough to shrink their displayed width when CSS minimum widths are reduced; this is true for modern mobile browsers.
- The duration display can be shown inline next to the time inputs or omitted on very small screens without losing critical functionality, since the start/end times already communicate duration implicitly.
