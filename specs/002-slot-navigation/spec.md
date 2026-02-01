# Feature Specification: Pool Availability Slot Navigation

**Feature Branch**: `002-slot-navigation`
**Created**: 2026-02-01
**Status**: Draft
**Input**: User description: "When viewing a pool availability provide buttons and associated keyboard bindings to jump to next/previous slot (right/left arrow key) and extend/reduce current slot size by 30min chunks (down/up arrow)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Available Slots (Priority: P1)

As a user viewing pool availability, I want to quickly navigate between available time slots using arrow keys or buttons so that I can efficiently browse booking options without excessive clicking or scrolling.

**Why this priority**: Core navigation is the foundation of the feature - without it, users cannot browse slots efficiently. This delivers immediate value by reducing the effort required to find desired booking times.

**Independent Test**: Can be fully tested by displaying pool availability, pressing left/right arrow keys or clicking navigation buttons, and verifying the slot selection moves accordingly.

**Acceptance Scenarios**:

1. **Given** a user is viewing pool availability with the first slot selected, **When** the user presses the right arrow key, **Then** the selection moves to the next available slot
2. **Given** a user is viewing pool availability with a middle slot selected, **When** the user presses the left arrow key, **Then** the selection moves to the previous available slot
3. **Given** a user is viewing pool availability with the first slot selected, **When** the user clicks the "Next" button, **Then** the selection moves to the next available slot
4. **Given** a user is viewing pool availability with a middle slot selected, **When** the user clicks the "Previous" button, **Then** the selection moves to the previous available slot

---

### User Story 2 - Extend Booking Duration (Priority: P2)

As a user viewing pool availability, I want to extend my selected booking slot by 30-minute increments using the down arrow key or a button so that I can quickly adjust my desired swimming time without manual input.

**Why this priority**: Duration adjustment is essential for customizing bookings but depends on having a slot selected first (P1). Extending time is the more common use case as users typically start with minimum slot and add time.

**Independent Test**: Can be tested by selecting any slot, pressing the down arrow or clicking the extend button, and verifying the slot duration increases by 30 minutes.

**Acceptance Scenarios**:

1. **Given** a user has selected a 30-minute slot, **When** the user presses the down arrow key, **Then** the slot duration extends to 60 minutes
2. **Given** a user has selected a 60-minute slot, **When** the user clicks the "Extend" button, **Then** the slot duration extends to 90 minutes
3. **Given** a user has selected a slot, **When** the user extends duration, **Then** the system shows the updated end time and total duration

---

### User Story 3 - Reduce Booking Duration (Priority: P3)

As a user viewing pool availability, I want to reduce my selected booking slot by 30-minute increments using the up arrow key or a button so that I can shorten my booking if I initially selected too much time.

**Why this priority**: Reduction is the counterpart to extension, providing complete duration control. Less common than extending but necessary for full feature completeness.

**Independent Test**: Can be tested by selecting a slot with duration greater than minimum, pressing the up arrow or clicking the reduce button, and verifying the slot duration decreases by 30 minutes.

**Acceptance Scenarios**:

1. **Given** a user has selected a 90-minute slot, **When** the user presses the up arrow key, **Then** the slot duration reduces to 60 minutes
2. **Given** a user has selected a 60-minute slot, **When** the user clicks the "Reduce" button, **Then** the slot duration reduces to 30 minutes
3. **Given** a user has selected a slot at minimum duration (30 minutes), **When** the user attempts to reduce duration, **Then** the system prevents further reduction and provides feedback

---

### Edge Cases

- What happens when the user navigates past the last available slot? The system stops at the last slot and provides visual feedback indicating the boundary
- What happens when the user navigates before the first available slot? The system stops at the first slot and provides visual feedback indicating the boundary
- What happens when extending a slot would overlap with the next booked slot? The system prevents extension and displays a message indicating the conflict
- What happens when extending a slot would exceed pool closing time? The system prevents extension and displays a message about operating hours
- What happens when no slots are available? Navigation controls are disabled with appropriate visual indication
- What happens when the user presses arrow keys while focus is on another interactive element (e.g., form input)? Keyboard navigation only activates when the availability view has focus

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide "Previous" and "Next" buttons for navigating between available time slots
- **FR-002**: System MUST support left arrow key to move selection to the previous available slot
- **FR-003**: System MUST support right arrow key to move selection to the next available slot
- **FR-004**: System MUST provide "Extend" and "Reduce" buttons for adjusting slot duration
- **FR-005**: System MUST support down arrow key to extend the current slot by 30 minutes
- **FR-006**: System MUST support up arrow key to reduce the current slot by 30 minutes
- **FR-007**: System MUST visually highlight the currently selected slot
- **FR-008**: System MUST display the current slot's start time, end time, and total duration
- **FR-009**: System MUST prevent reducing slot duration below the minimum booking duration (30 minutes)
- **FR-010**: System MUST prevent extending slot duration beyond available contiguous time or pool operating hours
- **FR-011**: System MUST provide visual feedback when navigation or duration adjustment is not possible (boundary reached, conflict exists)
- **FR-012**: System MUST only respond to keyboard navigation when the availability view component has focus
- **FR-013**: System MUST display keyboard shortcut hints near the navigation buttons for discoverability

### Key Entities

- **Time Slot**: Represents a bookable period with start time, end time, duration, and availability status
- **Selection State**: Tracks the currently selected slot and its adjusted duration (may differ from default slot duration)
- **Availability View**: The UI component displaying pool availability that captures keyboard events when focused

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate through all available slots using only keyboard controls (arrow keys)
- **SC-002**: Users can adjust slot duration from minimum (30 min) to maximum available time using only keyboard controls
- **SC-003**: 90% of users can successfully navigate and adjust slots without referring to help documentation
- **SC-004**: Time to select and adjust a desired booking slot reduces by at least 50% compared to mouse-only interaction
- **SC-005**: All navigation and adjustment actions provide visual feedback within 100ms of user input
- **SC-006**: Keyboard shortcuts are discoverable - 80% of users notice shortcut hints within first use session

## Assumptions

- The pool availability view already exists and displays time slots in a visual format
- Slots are displayed in chronological order
- The minimum booking duration is 30 minutes (industry standard for pool bookings)
- Users have access to standard keyboard with arrow keys
- The application runs in a web browser environment supporting standard keyboard events
- Navigation stops at boundaries (first/last slot) rather than wrapping
