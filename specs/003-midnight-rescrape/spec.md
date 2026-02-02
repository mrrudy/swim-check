# Feature Specification: Midnight Booking Data Rescrape

**Feature Branch**: `003-midnight-rescrape`
**Created**: 2026-02-01
**Status**: Draft
**Input**: User description: "backend. ensure new version of booking file for every pool is re-scraped after midnight if application is running or when application is started and it was not scraped during this day (at midnight or during earlier run) or api call is made enforcing re-scraping."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Midnight Refresh (Priority: P1)

As a system administrator, I need the booking data for all pools to be automatically refreshed after midnight each day so that users always see up-to-date availability information without manual intervention.

**Why this priority**: This is the core functionality - ensuring data freshness is the primary purpose of this feature. Without automatic midnight refresh, users would see stale booking data from the previous day.

**Independent Test**: Can be fully tested by running the application past midnight and verifying that new booking data is fetched for all configured pools.

**Acceptance Scenarios**:

1. **Given** the application is running and the clock passes midnight, **When** the next scheduled check occurs, **Then** booking data for all pools is re-scraped and stored
2. **Given** the application is running at 12:01 AM, **When** the midnight refresh triggers, **Then** each pool's booking file is updated with fresh data from the source
3. **Given** the midnight refresh is triggered, **When** one pool scrape fails, **Then** the system continues scraping remaining pools and logs the failure

---

### User Story 2 - Startup Catch-up Refresh (Priority: P2)

As a system administrator, I need the application to check if today's booking data has been scraped when it starts up, and if not, fetch fresh data immediately so that users get current information even if the application was offline at midnight.

**Why this priority**: This ensures data freshness after system restarts, outages, or deployments. Critical for operational reliability but secondary to the core midnight refresh.

**Independent Test**: Can be fully tested by stopping the application, waiting past midnight, restarting, and verifying that data is fetched on startup.

**Acceptance Scenarios**:

1. **Given** the application starts and today's data has not been scraped, **When** startup completes, **Then** booking data for all pools is immediately re-scraped
2. **Given** the application starts and today's data was already scraped, **When** startup completes, **Then** no re-scraping occurs
3. **Given** the application starts after being offline for multiple days, **When** startup completes, **Then** only data from currently available file is scraped (not backfilling historical data)

---

### User Story 3 - Manual Force Rescrape (Priority: P3)

As a system administrator, I need to be able to trigger a manual re-scrape of booking data via an API call so that I can refresh data on-demand when needed (e.g., after fixing a scraper issue or when a pool updates their schedule mid-day).

**Why this priority**: Provides operational flexibility for manual intervention. Useful but not essential for day-to-day operations.

**Independent Test**: Can be fully tested by making an API call and verifying that fresh data is fetched regardless of when the last scrape occurred.

**Acceptance Scenarios**:

1. **Given** an authorized request is made to the force-rescrape endpoint, **When** the request is processed, **Then** booking data for all pools is re-scraped immediately
2. **Given** a force-rescrape is requested for a specific pool, **When** the request is processed, **Then** only that pool's data is re-scraped
3. **Given** a force-rescrape is in progress, **When** another force-rescrape request arrives, **Then** the second request gets a "scrape in progress" error

---

### Edge Cases

- What happens when the system clock changes (e.g., daylight saving time)?
  - System should use consistent timezone handling and trigger based on local midnight
- How does the system handle multiple simultaneous scrape triggers?
  - System should prevent duplicate concurrent scrapes for the same pool
- What happens if a scrape takes longer than expected and overlaps with the next scheduled check?
  - System should skip the overlapping trigger and wait for the next cycle
- What happens if the data source is temporarily unavailable?
  - System should retry with backoff and log failures, keeping the previous data until successful
- What happens when a new pool is added to the configuration?
  - New pool should get scraped as there is no data available for it (neither midnight nor previous run did not scrape it)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically trigger a re-scrape of all pool booking data after midnight each day
- **FR-002**: System MUST check on startup whether today's data has been scraped, and fetch fresh data if not
- **FR-003**: System MUST provide an endpoint to force immediate re-scraping of booking data
- **FR-004**: System MUST track the last successful scrape timestamp for each pool
- **FR-005**: System MUST track the last successful scrape date to determine if today's scrape has occurred
- **FR-006**: System MUST continue processing remaining pools if one pool's scrape fails
- **FR-007**: System MUST log all scrape attempts, including successes and failures with relevant details
- **FR-008**: System MUST prevent concurrent scrape operations for the same pool
- **FR-009**: System MUST allow force-rescrape for a specific pool or all pools
- **FR-010**: System MUST use consistent timezone handling for midnight determination

### Key Entities

- **Scrape Record**: Represents a scrape operation; tracks pool identifier, scrape timestamp, success/failure status, and any error information
- **Pool Configuration**: Represents a pool to be scraped; includes source location and scrape settings
- **Scrape State**: Tracks the current state of scraping; last scrape date per pool, whether scrape is in progress (reset progress for all pools on application backend start)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of configured pools have booking data refreshed within 25 minutes after midnight when the application is running
- **SC-002**: On application startup, stale data is detected and refreshed within 60 seconds of startup completion
- **SC-003**: Manual force-rescrape requests are acknowledged and begin processing within 5 seconds
- **SC-004**: System maintains data freshness such that booking data is never more than 24 hours old during normal operation
- **SC-005**: Failed scrapes are retried and 95% of temporary failures recover within 3 retry attempts
- **SC-006**: All scrape operations (automatic and manual) are logged with sufficient detail for operational monitoring

## Assumptions

- The application uses a consistent timezone for determining "midnight" (assumed to be the server's local timezone or a configured timezone)
- Existing scraper infrastructure is in place and this feature adds scheduling/triggering logic on top
- The force-rescrape endpoint follows the existing API authentication patterns
- Scrape operations are idempotent - re-scraping simply overwrites the existing data
- The system has access to persistent storage for tracking scrape state across restarts
