# Research: Midnight Booking Data Rescrape

**Feature Branch**: `003-midnight-rescrape`
**Date**: 2026-02-01

## Research Tasks

### 1. Node.js Scheduling Approaches

**Question**: What is the best approach for scheduling jobs in a Node.js/Express application?

**Decision**: Use native Node.js `setTimeout` with date calculations for midnight scheduling, combined with `setInterval` for periodic checks.

**Rationale**:
- Follows Constitution Principle III (Simplicity): "Prefer standard library solutions over third-party dependencies"
- No external dependency required (node-cron, agenda, etc.)
- Easy to test with dependency injection of time functions
- Sufficient for a single-instance application

**Alternatives Considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| node-cron | Third-party dependency; overkill for single daily task |
| agenda (MongoDB-based) | Requires MongoDB; unnecessary complexity |
| bull/bullmq (Redis-based) | Requires Redis; designed for distributed systems |
| node-schedule | Third-party dependency; not necessary for simple use case |

**Implementation Approach**:
1. Calculate milliseconds until next midnight
2. Set timeout to trigger at midnight
3. After midnight trigger, reschedule for next midnight
4. On startup, check if today's scrape occurred; if not, trigger immediately

---

### 2. Concurrent Scrape Prevention

**Question**: How to prevent concurrent scrapes for the same pool?

**Decision**: Use an in-memory lock map with pool ID as key and scrape state as value.

**Rationale**:
- Simple boolean/state tracking per pool
- Reset all locks on application start (per spec: "reset progress for all pools on application backend start")
- No distributed locking needed for single-instance application

**Implementation**:
```typescript
interface ScrapeState {
  inProgress: boolean;
  lastScrapeDate: string | null;  // YYYY-MM-DD format
  lastScrapeTimestamp: Date | null;
}

const scrapeStates = new Map<string, ScrapeState>();
```

---

### 3. Timezone Handling

**Question**: How should "midnight" be determined?

**Decision**: Use server local timezone with explicit configuration option.

**Rationale**:
- Application serves local swimming pools in a single timezone (Poland)
- Node.js Date uses local timezone by default
- Add environment variable for explicit timezone if needed later

**Implementation**:
- Use `new Date()` and check `getHours() === 0` or calculate next midnight
- Store dates in ISO format for database (YYYY-MM-DD)
- Log timezone info at startup for debugging

---

### 4. Retry Strategy

**Question**: How should failed scrapes be retried?

**Decision**: Use exponential backoff with maximum 3 retries, then skip until next cycle.

**Rationale**:
- Matches existing scraper config: `maxRetries: 3`
- Exponential backoff prevents hammering failed sources
- Spec SC-005: "95% of temporary failures recover within 3 retry attempts"

**Implementation**:
- Base delay: 2 seconds
- Backoff multiplier: 2x
- Delays: 2s, 4s, 8s (total ~14s retry window)
- Log each retry attempt
- After 3 failures, log error and continue to next pool

---

### 5. Force Rescrape API Design

**Question**: What should the force-rescrape API endpoint look like?

**Decision**: `POST /api/v1/admin/rescrape` with optional `poolId` query parameter.

**Rationale**:
- POST is appropriate for action that modifies state
- `/admin/` prefix indicates administrative action
- Optional `poolId` allows single pool or all pools
- Returns 409 Conflict if scrape already in progress

**Endpoints**:
```
POST /api/v1/admin/rescrape           # Rescrape all pools
POST /api/v1/admin/rescrape?poolId=X  # Rescrape specific pool

Response 200: { message: "Rescrape started", pools: [...] }
Response 409: { error: "Scrape already in progress", poolId: "..." }
```

---

### 6. State Persistence Across Restarts

**Question**: How should scrape state be persisted?

**Decision**: Use existing SQLite database with new `scrape_jobs` table.

**Rationale**:
- Spec: "system has access to persistent storage for tracking scrape state across restarts"
- Leverage existing sql.js infrastructure
- Simple table structure for tracking last scrape per pool

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS scrape_jobs (
  pool_id TEXT PRIMARY KEY,
  last_scrape_date TEXT,           -- YYYY-MM-DD (local date)
  last_scrape_timestamp TEXT,      -- ISO datetime
  last_scrape_status TEXT,         -- 'success' | 'failure'
  last_error_message TEXT,
  FOREIGN KEY (pool_id) REFERENCES swimming_pools(id)
);
```

---

### 7. Scraper Orchestration

**Question**: How should multiple scrapers be coordinated?

**Decision**: Sequential execution with configurable delay between pools.

**Rationale**:
- Spec SC-001: "within 25 minutes after midnight" (allows sequential processing)
- Avoids overwhelming external services
- Easier error isolation and logging
- Respects existing `minDelayMs/maxDelayMs` config

**Implementation**:
- Iterate through all registered scrapers
- Execute scrape for each pool
- Wait 2-6 seconds between pools (existing config)
- Continue to next pool on failure

---

## Summary

All technical decisions align with the Constitution's core principles:

| Decision | Constitution Alignment |
|----------|------------------------|
| Native setTimeout/setInterval | Principle III: Simplicity - standard library over dependencies |
| In-memory lock map | Principle III: Simplicity - minimal solution |
| SQLite persistence | Principle III: Simplicity - leverage existing infrastructure |
| Sequential scraping | Principle III: Simplicity - easier to reason about |
| Exponential backoff | Existing pattern in codebase |

No additional third-party dependencies required.
