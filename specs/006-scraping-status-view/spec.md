# Feature Specification: Scraping Status View

**Feature Branch**: `006-scraping-status-view`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "read-only view of last scraping per swimming pool in a separate tab, showing links used for scraping, time and status."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Last Scraping Status Per Pool (Priority: P1)

As a user monitoring the swim check system, I want to see a dedicated tab displaying the last scraping status for each swimming pool so that I can quickly verify whether data collection is working properly and identify any pools with stale or failed scrapes.

**Why this priority**: This is the core value of the feature - providing visibility into the health of the scraping system. Without this, users cannot know if the displayed availability data is current or outdated.

**Independent Test**: Can be fully tested by navigating to the Scraping Status tab and verifying that each configured pool displays its last scrape information with timestamp, status, and source links.

**Acceptance Scenarios**:

1. **Given** the user is on the main application, **When** they navigate to the Scraping Status tab, **Then** they see a list of all configured swimming pools with their last scraping information
2. **Given** the Scraping Status tab is open, **When** viewing a pool entry, **Then** the user sees the pool name, last scrape timestamp, status (success/failure), and the source link(s) used for scraping
3. **Given** the Scraping Status tab is open, **When** a pool has never been scraped, **Then** the entry displays "Never scraped" with appropriate styling

---

### User Story 2 - Identify Outdated or Failed Scrapes (Priority: P2)

As a user, I want visual indicators to highlight pools with old or failed scrapes so that I can quickly spot potential issues without manually checking each timestamp.

**Why this priority**: Enhances usability by making problems immediately visible. Builds on P1 by adding visual cues that surface issues without requiring users to analyze raw data.

**Independent Test**: Can be tested by triggering failed scrapes or waiting for data to become stale, then verifying visual indicators appear correctly.

**Acceptance Scenarios**:

1. **Given** the Scraping Status tab is open, **When** a pool's last scrape failed, **Then** the entry displays with an error indicator (color/icon)
2. **Given** the Scraping Status tab is open, **When** a pool's last scrape is older than 24 hours, **Then** the entry displays with a warning indicator showing the data may be stale
3. **Given** the Scraping Status tab is open, **When** a pool's last scrape succeeded within the last 24 hours, **Then** the entry displays with a success indicator

---

### User Story 3 - Access Scraping Source Links (Priority: P3)

As a user investigating scraping issues, I want to click on the source links displayed for each pool so that I can manually verify the source data or diagnose why a scrape may have failed.

**Why this priority**: Provides debugging capability for advanced users. Lower priority because most users primarily need visibility, not direct source access.

**Independent Test**: Can be tested by clicking each source link and verifying it opens the correct URL in a new browser tab.

**Acceptance Scenarios**:

1. **Given** the Scraping Status tab displays a pool with source links, **When** the user clicks a source link, **Then** the link opens in a new browser tab
2. **Given** a pool has multiple source links (e.g., schedule page and PDF), **When** viewing the pool entry, **Then** all source links are displayed and individually clickable

---

### Edge Cases

- What happens when a pool is newly configured but has never been scraped? Display "Never scraped" with neutral styling
- How does system handle when the backend API is unavailable? Display an error message in the tab with retry option
- What happens when source URLs contain special characters? URLs are properly encoded and displayed
- How does the view handle pools with no configured source links? Display "No source configured" for the links field

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a separate "Scraping Status" tab in the application navigation
- **FR-002**: System MUST show all configured swimming pools in the Scraping Status view
- **FR-003**: For each pool, system MUST display the last scrape timestamp in a human-readable format (e.g., "2 hours ago" or "Jan 15, 2026 14:30")
- **FR-004**: For each pool, system MUST display the scraping status (success, failure, or never scraped)
- **FR-005**: For each pool, system MUST display clickable links to the source URLs used for scraping
- **FR-006**: System MUST open source links in a new browser tab when clicked
- **FR-007**: The view MUST be read-only with no edit capabilities
- **FR-008**: System MUST visually distinguish between successful, failed, and stale scraping states
- **FR-009**: System MUST display an appropriate message when scraping data is unavailable from the backend
- **FR-010**: System MUST fetch scraping status data from the backend API on tab load

### Key Entities

- **Scraping Status**: Represents the result of a scraping operation - includes pool identifier, timestamp, success/failure status, and any error message
- **Pool Source Link**: The URL(s) used to scrape data for a pool - includes link URL and link type/description (e.g., "Schedule Page", "PDF Schedule")
- **Swimming Pool**: Reference to the pool entity - links scraping status to the pool's display name

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the scraping status of all pools within 3 seconds of navigating to the tab
- **SC-002**: Users can identify pools with failed or stale scrapes within 5 seconds by visual indicators alone
- **SC-003**: 100% of source links are clickable and open the correct URL in a new tab
- **SC-004**: Users report increased confidence in data freshness (qualitative feedback after deployment)

## Assumptions

- The backend already tracks and stores scraping metadata (timestamp, status, source URLs) for each pool
- The existing application navigation supports adding a new tab
- Scraping operations are performed by an existing backend process; this feature only displays status
- "Stale" data is defined as scraping that occurred more than 24 hours ago (reasonable default for pool schedules that update infrequently)
- The application uses relative timestamps (e.g., "2 hours ago") for recent times and absolute timestamps for older entries
