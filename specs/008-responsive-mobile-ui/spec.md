# Feature Specification: Responsive Mobile UI

**Feature Branch**: `008-responsive-mobile-ui`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "webui interface clean and efficient and mobile friendly. the menu (Favorites Search Pools Scraping Status) should be shrinking automatically to a menu button (3 dots or dashes) when small screen/window. similarly title and description of the app should not consume real estate. the navigation menu (arrow based) should be around the list of slots and fixed to the edges so if user clicks 5% edge area right the Next function is called, 5% left - Prev, 5% bottom +30m, 5% top -30m."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responsive Navigation Menu (Priority: P1)

As a mobile user, I want the main navigation menu (Favorites, Search, Pools, Scraping Status) to collapse into a hamburger-style menu button (three horizontal lines) on small screens, so the navigation does not consume excessive screen space.

**Why this priority**: The navigation menu is always visible and takes up significant horizontal space. On mobile devices, a collapsed menu is the most impactful single change for usability—without it, the app is barely usable on phones.

**Independent Test**: Can be fully tested by resizing the browser window below the breakpoint and verifying the menu collapses into a button, then tapping the button to see the full menu appear.

**Acceptance Scenarios**:

1. **Given** the app is displayed on a screen narrower than 800px, **When** the page loads, **Then** the navigation menu items are hidden and replaced by a single menu button icon (three horizontal lines).
2. **Given** the collapsed menu button is visible, **When** the user taps/clicks the menu button, **Then** a dropdown or overlay menu appears showing all navigation items (Favorites, Search, Pools, Scraping Status).
3. **Given** the expanded mobile menu is open, **When** the user selects a navigation item, **Then** the app navigates to the selected page and the menu closes automatically.
4. **Given** the expanded mobile menu is open, **When** the user taps outside the menu or presses the menu button again, **Then** the menu closes.
5. **Given** the app is displayed on a screen wider than 800px, **When** the page loads, **Then** the navigation menu items are displayed inline horizontally as they are today.

---

### User Story 2 - Edge-Zone Slot Navigation (Priority: P1)

As a user browsing pool availability on a touchscreen or desktop, I want to navigate between time slots and adjust duration by tapping/clicking the edges of the slot display area, so I can navigate without reaching for small buttons.

**Why this priority**: This is the core interaction model for the app. Making slot navigation gesture-friendly transforms the mobile experience from awkward button-tapping to natural edge-swiping, and also improves desktop usability.

**Independent Test**: Can be fully tested by clicking/tapping within the 5% edge zones of the slot list area and verifying the correct navigation action fires.

**Acceptance Scenarios**:

1. **Given** the slot list is displayed, **When** the user clicks/taps within the rightmost 5% of the slot display area, **Then** the "Next" slot navigation action is triggered (equivalent to pressing the Next button or right arrow key).
2. **Given** the slot list is displayed, **When** the user clicks/taps within the leftmost 5% of the slot display area, **Then** the "Previous" slot navigation action is triggered (equivalent to pressing the Prev button or left arrow key).
3. **Given** the slot list is displayed, **When** the user clicks/taps within the bottommost 5% of the slot display area, **Then** the "+30 minutes" duration extension action is triggered (equivalent to pressing the down arrow key).
4. **Given** the slot list is displayed, **When** the user clicks/taps within the topmost 5% of the slot display area, **Then** the "-30 minutes" duration reduction action is triggered (equivalent to pressing the up arrow key).
5. **Given** the user clicks/taps in the center area (outside all edge zones), **When** the click occurs, **Then** no navigation action is triggered and normal interaction occurs.
6. **Given** a navigation boundary is reached (e.g., first slot, minimum duration), **When** the user taps the corresponding edge zone, **Then** no action is taken (consistent with existing boundary behavior).
7. **Given** the edge zones are active, **When** the user interacts with them, **Then** a subtle visual indicator (e.g., brief directional arrow or highlight) appears to confirm the action was recognized.

---

### User Story 3 - Compact Header and Title (Priority: P2)

As a mobile user, I want the app title and description to take up minimal vertical space so that more of the screen is dedicated to pool availability data.

**Why this priority**: While less critical than navigation, the header consumes valuable vertical real estate on small screens. Compacting it significantly improves the amount of useful content visible without scrolling.

**Independent Test**: Can be fully tested by viewing the app on a small screen and verifying the title area is compact with no subtitle visible.

**Acceptance Scenarios**:

1. **Given** the app is displayed on a screen narrower than 800px, **When** the page loads, **Then** the app title is displayed in a smaller, compact font size and the subtitle ("Check lane availability at your favorite pools") is hidden.
2. **Given** the app is displayed on a screen wider than 800px, **When** the page loads, **Then** the title and subtitle are displayed at their current sizes.
3. **Given** the compact header is displayed, **When** the user views the header area, **Then** the header (title + menu button) occupies a single row of height.

---

### User Story 4 - Overall Mobile-Friendly Layout (Priority: P2)

As a mobile user, I want all page content (pool lists, slot grids, search results) to reflow cleanly on small screens so nothing is cut off or requires horizontal scrolling.

**Why this priority**: This story ensures all pages work on mobile, not just the header/nav. It is a foundational requirement for mobile friendliness but is ranked P2 because P1 items address the most-used interactive elements.

**Independent Test**: Can be fully tested by loading each page (Favorites, Search, Pool Detail, Scraping Status) on a mobile-width viewport and verifying content reflows without horizontal scroll.

**Acceptance Scenarios**:

1. **Given** any page of the app is displayed on a mobile-width screen, **When** the page loads, **Then** no horizontal scrollbar appears and all content is accessible by vertical scrolling only.
2. **Given** the pool detail page with lane availability grid is displayed on a mobile screen, **When** the page loads, **Then** the grid columns adjust to fit the screen width.
3. **Given** the favorites combined view is displayed on mobile, **When** the page loads, **Then** pool cards stack vertically and are full-width.

---

### Edge Cases

- What happens when the screen is exactly at the breakpoint width (800px)? The desktop layout is shown at 800px; collapsed layout applies below 800px.
- What happens when the user rotates a mobile device from portrait to landscape? The layout transitions smoothly between collapsed and expanded states based on the new viewport width.
- What happens if the user rapidly taps an edge zone multiple times? Each tap triggers the navigation action independently—the existing slot boundary checks prevent out-of-range navigation.
- What happens when edge zones overlap at corners (e.g., top-right)? Horizontal navigation (left/right) takes priority over vertical (top/bottom) in corner overlap areas.
- What happens if the slot list area is too small for meaningful edge zones? A minimum touch target of 20px is enforced for each edge zone regardless of the 5% calculation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The navigation menu MUST collapse into a hamburger menu button (three horizontal lines icon) when the viewport width is below 800px.
- **FR-002**: The hamburger menu MUST open an overlay or dropdown displaying all navigation items when activated.
- **FR-003**: The mobile menu MUST close when a navigation item is selected, when the user taps outside the menu, or when the hamburger button is tapped again.
- **FR-004**: The app title MUST reduce to a compact single-line format on viewports below 800px, hiding the subtitle.
- **FR-005**: The header (title + navigation) MUST occupy a single row on mobile viewports.
- **FR-006**: The slot display area MUST have invisible edge-zone overlays covering the outer 5% of each side (left, right, top, bottom).
- **FR-007**: Clicking/tapping the right edge zone MUST trigger the "Next" slot navigation action.
- **FR-008**: Clicking/tapping the left edge zone MUST trigger the "Previous" slot navigation action.
- **FR-009**: Clicking/tapping the bottom edge zone MUST trigger the "+30 minutes" duration action.
- **FR-010**: Clicking/tapping the top edge zone MUST trigger the "-30 minutes" duration action.
- **FR-011**: Edge zone navigation MUST respect existing navigation boundaries (no action at first/last slot or min/max duration).
- **FR-012**: Edge zone activation MUST provide brief visual feedback (directional indicator or highlight flash).
- **FR-013**: In corner overlap areas where edge zones intersect, horizontal navigation (left/right) MUST take priority over vertical (top/bottom).
- **FR-014**: Each edge zone MUST have a minimum touch target of 20px regardless of the 5% calculation.
- **FR-015**: All page content MUST reflow to avoid horizontal scrolling on viewports as narrow as 320px.
- **FR-016**: Existing keyboard navigation (arrow keys) MUST continue to work unchanged alongside edge-zone navigation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All app pages render without horizontal scrollbar on viewports from 320px to 1920px wide.
- **SC-002**: The navigation menu collapses to a single button on screens below 800px and all menu items remain accessible within one tap.
- **SC-003**: Users can navigate between time slots and adjust duration using edge-zone taps with 100% reliability (every tap in the zone triggers the action).
- **SC-004**: The header area occupies no more than 48px of vertical space on mobile screens (below 800px).
- **SC-005**: Edge-zone visual feedback appears within 100ms of a tap and disappears within 300ms.
- **SC-006**: Navigation between collapsed and expanded menu states completes in under 200ms (perceived as instant).
- **SC-007**: All existing keyboard shortcuts continue to function identically after the responsive changes.

## Assumptions

- The collapse breakpoint of 800px is appropriate for distinguishing mobile from desktop layouts (standard small tablet/large phone threshold).
- The hamburger icon (three horizontal lines) is preferred over a three-dots icon for the collapsed menu button, as it is the most universally recognized pattern for hidden navigation menus.
- The 5% edge zone size provides a good balance between easy touch targets and not interfering with content interaction in the center area.
- Edge-zone navigation applies to the slot/lane grid display area on the Pool Detail page and the combined favorites view, not to other pages like Search or Scraping Status where slot navigation is not relevant.
- Visual feedback for edge-zone taps should be subtle (a brief arrow flash or highlight) rather than intrusive, to avoid cluttering the interface.
- The minimum supported viewport width is 320px (iPhone SE / small Android devices).
