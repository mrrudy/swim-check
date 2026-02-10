# Feature Specification: Teatralna Basen 1 Pool Scraper

**Feature Branch**: `010-teatralna-pool-scraper`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "Scraper for Teatralna - Basen 1 at spa.wroc.pl. Web-based, spot-based availability translated into lane equivalents. 30 spots = 5 lanes (6 spots per lane). Configurable parameters for reuse with other pools. Scrape frequency every 3 hours (online booking system)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Teatralna Basen 1 Lane Availability (Priority: P1)

As a swimmer, I want to see how many lanes are available at Teatralna Basen 1 for each hour of the day so I can decide when to swim without visiting the booking website directly.

The pool's booking system reports availability in "spots" (individual swimmer places). Since swimmers think in terms of lanes, the system translates spots into lane equivalents: 30 total spots divided into 5 lanes of 6 spots each. Partial lane occupancy rounds down to show only fully available lanes (e.g., 12 free spots = 2 full lanes available).

**Why this priority**: Core value proposition - without scraping and translating the data, the feature has no purpose.

**Independent Test**: Can be fully tested by running the scraper against the live website and verifying that spot counts are correctly fetched and translated into lane equivalents.

**Acceptance Scenarios**:

1. **Given** the Teatralna Basen 1 booking page shows "Wolne miejsca: 30" for a time slot, **When** the scraper processes that slot, **Then** it reports 5 of 5 lanes available.
2. **Given** the booking page shows "Wolne miejsca: 12" for a time slot, **When** the scraper processes that slot, **Then** it reports 2 of 5 lanes available.
3. **Given** the booking page shows "Wolne miejsca: 0" or no availability for a time slot, **When** the scraper processes that slot, **Then** it reports 0 of 5 lanes available.
4. **Given** the booking page shows "Wolne miejsca: 7" for a time slot, **When** the scraper processes that slot, **Then** it reports 1 of 5 lanes available (7 spots = 1 full lane + 1 partial, only full lanes counted).
5. **Given** the booking page shows a reduced total capacity (e.g., only 12 max spots for a slot), **When** the scraper processes that slot and 12 of 12 are free, **Then** it reports 2 of 2 lanes available (total lanes adjusts to match reduced capacity).
6. **Given** the booking page shows empty cell (no text) for given time, **When** the scraper processes that slot, **Then** it reports 0 of 5 lanes available.

---

### User Story 2 - Frequent Automatic Updates (Priority: P2)

As a swimmer planning my day, I want the availability data for Teatralna Basen 1 to be refreshed every 3 hours so that I see near-real-time information since this pool uses an online booking system where availability changes frequently.

**Why this priority**: Unlike PDF-based schedules that change once per week, online booking availability changes constantly. Frequent updates are essential for the data to be useful.

**Independent Test**: Can be tested by verifying that the scraper runs on a 3-hour cycle and that scraped data timestamps reflect the expected frequency.

**Acceptance Scenarios**:

1. **Given** the scraper is configured for Teatralna Basen 1, **When** the system is running, **Then** it scrapes availability every 3 hours rather than only at midnight.
2. **Given** a previous scrape completed at 09:00, **When** the clock reaches 12:00, **Then** a new scrape is triggered automatically.
3. **Given** a scrape fails, **When** the next scheduled interval arrives, **Then** the system retries the scrape using existing retry logic.

---

### User Story 3 - Configurable Scraper Parameters (Priority: P3)

As a developer, I want the scraper's key parameters (total spots, spots per lane, total lanes, booking page URL, pool name) to be defined as configuration variables at the top of the code so that the scraper can be easily adapted for other pools at the same facility (e.g., Basen 2, Basen Rekreacyjny) in the future.

**Why this priority**: Reusability reduces future development effort but doesn't affect end-user experience for the current pool.

**Independent Test**: Can be tested by changing configuration values and verifying the scraper adapts correctly without code changes to the parsing logic.

**Acceptance Scenarios**:

1. **Given** the scraper configuration defines totalSpots=30 and spotsPerLane=6, **When** these values are changed to totalSpots=20 and spotsPerLane=5, **Then** the scraper correctly calculates 4 total lanes and maps availability accordingly.
2. **Given** the scraper configuration defines the booking URL, **When** the URL is changed to a different pool page, **Then** the scraper fetches data from the new URL.

---

### Edge Cases

- What happens when the booking website is unreachable? The scraper returns a failure status and retains the last known data (existing system behavior).
- What happens when the website structure changes? The parser fails gracefully, logs an error, and the scrape job is marked as failed.
- What happens when a time slot shows more spots than the configured total (e.g., 35 free of 30)? The scraper caps available lanes at the configured maximum (5 lanes).
- What happens when the website shows no schedule data (e.g., pool closed for maintenance)? The scraper reports 0 availability for all slots and logs a warning.
- What happens when the page shows hourly slots but the system expects 30-minute granularity? The scraper duplicates each hourly reading into two 30-minute slots (e.g., 08:00 data applies to both 08:00-08:30 and 08:30-09:00).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scrape the Teatralna Basen 1 booking page to extract per-hour spot availability ("Wolne miejsca: N").
- **FR-002**: System MUST translate spot counts into lane equivalents using the formula: `availableLanes = floor(freeSpots / spotsPerLane)` where spotsPerLane defaults to 6.
- **FR-003**: System MUST calculate the total available lanes for each slot based on the maximum spots shown for that slot: `totalLanes = floor(maxSpots / spotsPerLane)`, defaulting to `floor(totalSpots / spotsPerLane)` when max spots equal the configured total.
- **FR-004**: System MUST map hourly availability data to the system's 30-minute slot granularity by applying the same availability to both half-hour slots within each hour.
- **FR-005**: System MUST scrape availability for all displayed dates (typically a week's schedule) in a single scrape operation.
- **FR-006**: System MUST run scrapes every 3 hours instead of only at midnight, reflecting the real-time nature of the online booking system.
- **FR-007**: System MUST define key scraper parameters (total spots, spots per lane, booking page URL, pool identifier) as configurable constants at the top of the scraper code.
- **FR-008**: System MUST follow the existing scraper interface and register with the scraper registry.
- **FR-009**: System MUST store scraped availability data in the existing booking data format.
- **FR-010**: System MUST implement a health check that verifies the booking page is reachable.
- **FR-011**: System MUST store the resolved source URL for the scraping status view.

### Key Entities

- **Teatralna Pool (Basen 1)**: A swimming pool at Wroclaw SPA center (ul. Teatralna) with 30 individual swimming spots that translate to 5 lane equivalents. Schedule available at spa.wroc.pl.
- **Spot-to-Lane Mapping**: Conversion rule where 6 spots = 1 lane. Available lanes = floor(free spots / 6). Total lanes = floor(max spots / 6).
- **Hourly Schedule**: The booking system displays availability per full hour (06:00, 07:00, ... 22:00). Each hour maps to two 30-minute system slots.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teatralna Basen 1 availability data appears in the application alongside other pools within one scrape cycle after deployment.
- **SC-002**: Lane availability numbers match manual verification against the booking website for at least 95% of time slots.
- **SC-003**: Availability data is refreshed at least every 3 hours during normal operation.
- **SC-004**: The scraper recovers from temporary website outages within one retry cycle without manual intervention.
- **SC-005**: Changing the scraper's configuration constants (spots, lanes, URL) correctly adapts the scraper behavior without modifying parsing logic.

## Assumptions

- The booking website at spa.wroc.pl uses server-rendered HTML that can be parsed without JavaScript execution (confirmed by initial page analysis - data is in static HTML).
- The "Wolne miejsca: N" pattern is consistent across all time slots on the page.
- The schedule always shows a weekly view with hourly slots from 06:00 to 22:00.
- The existing scheduler infrastructure can be extended to support per-pool scrape intervals (every 3 hours) in addition to the global midnight schedule.
- Lane IDs will be seeded in the database during pool registration, following the existing pattern.
- The standard 30-minute slot granularity is acceptable even though the source provides hourly data (duplicating availability across both half-hour slots within each hour).
