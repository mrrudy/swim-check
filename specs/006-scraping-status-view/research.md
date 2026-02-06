# Research: Scraping Status View

**Feature Branch**: `006-scraping-status-view`
**Date**: 2026-02-06

## Overview

This document captures research findings for the Scraping Status View feature. All "NEEDS CLARIFICATION" items from the Technical Context have been investigated and resolved.

---

## Research Item 1: Source URLs for Scrapers

### Question
How should source URLs be exposed for each pool in the scraping status view?

### Investigation

**Current State:**
- Each scraper has hardcoded source URLs as constants (e.g., `AQUAPARK_SCHEDULE_URL`, `SLEZA_SCHEDULE_PAGE_URL`)
- The `PoolScraperMetadata` interface includes `poolId`, `name`, `version` but NOT source URLs
- The `PoolScraper` interface doesn't expose source URLs
- The `PoolScrapeStatusResponse` API type has `poolId`, `poolName`, `lastScrapeDate`, `lastScrapeStatus`, `inProgress` but NO source URLs
- Pool entity (`SwimmingPool`) has `websiteUrl` field but this is the pool's general website, not necessarily the scraping source

**Scraper Source URLs Found:**
1. **Aquapark Wrocław Borowska** (`packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/index.ts`):
   - Schedule Page: `https://aquapark.wroc.pl/pl/grafik-rezerwacji-basenu-sportowego`
   - PDF: Dynamically discovered from schedule page

2. **Centrum Śleża** (`packages/backend/src/scrapers/pools/sleza-centrum/index.ts`):
   - Schedule Page: `https://www.centrumsleza.pl/grafiki/`
   - Google Sheets: `https://docs.google.com/spreadsheets/d/13tqiOBZubRID83MU6suo7ZyfvCQfjP-p9Z1vaozmioE/edit?gid=74077863`

### Decision
**Extend the `PoolScraperMetadata` interface** to include an optional `sourceUrls` array. Each scraper will expose its source URLs through this metadata.

**Type Definition:**
```typescript
interface SourceLink {
  url: string;
  label: string;  // e.g., "Schedule Page", "PDF Schedule", "Google Sheets"
}

interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
  sourceUrls?: SourceLink[];  // NEW: Optional source URLs
}
```

### Rationale
- Keeps source URL definition close to each scraper implementation
- Doesn't require database schema changes
- Allows scrapers to have multiple source URLs with descriptive labels
- Optional field maintains backward compatibility

### Alternatives Considered
1. **Store in database**: Would require schema migration and redundant data (URLs already in code)
2. **Use pool's websiteUrl**: Not specific enough; pool website ≠ schedule page
3. **Hardcode in frontend**: Would require frontend changes for each new scraper

---

## Research Item 2: Relative Timestamp Formatting

### Question
What's the best approach for formatting timestamps as "2 hours ago" or absolute dates in React?

### Investigation

**Spec Requirements (FR-003):**
- Human-readable format (e.g., "2 hours ago" or "Jan 15, 2026 14:30")
- Relative for recent times, absolute for older entries

**Options Evaluated:**

1. **Intl.RelativeTimeFormat (native API)**
   - Pros: No dependencies, good browser support (98%+)
   - Cons: Manual logic needed for unit selection, no automatic threshold switching

2. **date-fns `formatDistanceToNow`**
   - Pros: Already used in ecosystem, lightweight, tree-shakeable
   - Cons: Adds dependency

3. **Custom utility function**
   - Pros: Full control, no dependencies
   - Cons: More code to maintain

### Decision
**Create a custom utility function** using native `Intl.RelativeTimeFormat` with threshold-based switching.

**Implementation:**
```typescript
const STALE_THRESHOLD_HOURS = 24;

function formatScrapedAt(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Use relative time for recent (<48 hours), absolute for older
  if (diffHours < 48) {
    return formatRelativeTime(date);  // "2 hours ago"
  }

  return formatAbsoluteTime(date);  // "Jan 15, 2026 14:30"
}

function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffMs = Date.now() - date.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return rtf.format(-minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');

  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}
```

### Rationale
- No new dependencies (follows Simplicity principle)
- Native API provides localization for free
- 48-hour threshold gives good balance between relative/absolute

### Alternatives Considered
1. **date-fns**: Would add ~5KB dependency for simple use case
2. **moment.js**: Too heavy, deprecated
3. **Always absolute**: Less user-friendly for recent times

---

## Research Item 3: Navigation Tab Integration

### Question
How should the new "Scraping Status" tab be integrated into the existing navigation?

### Investigation

**Current Navigation Structure** (`packages/frontend/src/App.tsx`):
```tsx
<nav style={styles.nav}>
  <Link to="/" style={styles.navLink}>Favorites</Link>
  <Link to="/search" style={styles.navLink}>Search Pools</Link>
</nav>

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/search" element={<Search />} />
  <Route path="/pools/:poolId" element={<PoolDetail />} />
</Routes>
```

**Pattern Observations:**
- Simple horizontal nav links with consistent styling
- Routes defined in single `<Routes>` block
- Page components in `pages/` directory

### Decision
**Add new route and nav link following existing pattern:**

```tsx
<nav style={styles.nav}>
  <Link to="/" style={styles.navLink}>Favorites</Link>
  <Link to="/search" style={styles.navLink}>Search Pools</Link>
  <Link to="/scraping-status" style={styles.navLink}>Scraping Status</Link>
</nav>

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/search" element={<Search />} />
  <Route path="/pools/:poolId" element={<PoolDetail />} />
  <Route path="/scraping-status" element={<ScrapingStatus />} />
</Routes>
```

### Rationale
- Follows existing pattern (Simplicity principle)
- URL path is descriptive and SEO-friendly
- Consistent with other navigation items

### Alternatives Considered
1. **Admin subroute `/admin/scraping-status`**: Unnecessary complexity; this is a read-only view
2. **Modal/drawer**: Would break from existing navigation pattern
3. **Tab component library**: Overkill for 3-4 simple links

---

## Research Item 4: Visual Status Indicators

### Question
What visual indicators should be used for success/failure/stale/never states?

### Investigation

**Spec Requirements (FR-008, User Story 2):**
- Visual distinction between successful, failed, and stale scraping states
- Error indicator (color/icon) for failed scrapes
- Warning indicator for stale data (>24 hours)
- Success indicator for recent successful scrapes

### Decision
**Color-coded status badges with semantic meaning:**

| State | Color | Text | Condition |
|-------|-------|------|-----------|
| Success | Green (#22c55e) | "Success" | `lastScrapeStatus === 'success'` AND `< 24 hours ago` |
| Stale | Amber (#f59e0b) | "Stale" | `lastScrapeStatus === 'success'` AND `>= 24 hours ago` |
| Failed | Red (#ef4444) | "Failed" | `lastScrapeStatus === 'failure'` |
| Never | Gray (#6b7280) | "Never scraped" | `lastScrapeStatus === null` |
| In Progress | Blue (#3b82f6) | "Scraping..." | `inProgress === true` |

**Implementation:**
```typescript
type ScrapingStatusType = 'success' | 'stale' | 'failed' | 'never' | 'in-progress';

function getStatusType(
  lastScrapeStatus: 'success' | 'failure' | null,
  lastScrapeDate: string | null,
  inProgress: boolean
): ScrapingStatusType {
  if (inProgress) return 'in-progress';
  if (!lastScrapeStatus) return 'never';
  if (lastScrapeStatus === 'failure') return 'failed';

  // Check staleness
  if (lastScrapeDate) {
    const lastScrape = new Date(lastScrapeDate);
    const hoursSince = (Date.now() - lastScrape.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 24) return 'stale';
  }

  return 'success';
}
```

### Rationale
- Uses standard semantic colors (green=good, amber=warning, red=error)
- Clear visual hierarchy for quick scanning (SC-002: identify issues in 5 seconds)
- In-progress state provides feedback during active scraping

### Alternatives Considered
1. **Icons only**: Less accessible, requires learning curve
2. **Icons + colors**: More complex, not necessary for MVP
3. **Progress bar for staleness**: Overengineered for current needs

---

## Research Item 5: API Endpoint Strategy

### Question
Should we use the existing `/admin/scheduler/status` endpoint or create a new one?

### Investigation

**Existing Endpoint** (`GET /api/v1/admin/scheduler/status`):
```typescript
interface SchedulerStatusResponse {
  isRunning: boolean;
  nextScheduledRun: string | null;
  lastRunTimestamp: string | null;
  poolStatuses: PoolScrapeStatusResponse[];
}

interface PoolScrapeStatusResponse {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null;
  lastScrapeStatus: 'success' | 'failure' | null;
  inProgress: boolean;
}
```

**Missing Fields:**
- `lastScrapeTimestamp` (full ISO timestamp, not just date)
- `lastErrorMessage` (for failed scrapes)
- `sourceUrls` (links used for scraping)

### Decision
**Extend the existing endpoint** by enhancing `PoolScrapeStatusResponse` with additional fields.

**Extended Type:**
```typescript
interface PoolScrapeStatusResponse {
  poolId: string;
  poolName: string;
  lastScrapeDate: string | null;       // YYYY-MM-DD
  lastScrapeTimestamp: string | null;  // NEW: ISO 8601 full timestamp
  lastScrapeStatus: 'success' | 'failure' | null;
  lastErrorMessage: string | null;     // NEW: Error message if failed
  inProgress: boolean;
  sourceUrls: SourceLink[];            // NEW: Scraping source links
}

interface SourceLink {
  url: string;
  label: string;
}
```

### Rationale
- Reuses existing endpoint (Simplicity principle)
- Additional fields don't break existing consumers (backward compatible)
- All data comes from existing sources (scrape jobs table + scraper metadata)

### Alternatives Considered
1. **New `/api/v1/scraping-status` endpoint**: Would duplicate code; no functional benefit
2. **Separate endpoints for different data**: Would require multiple API calls; worse UX
3. **GraphQL**: Massive overkill for this use case

---

## Summary of Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| Source URLs | Extend `PoolScraperMetadata` with `sourceUrls` | Keeps data with scraper, no DB changes |
| Timestamp formatting | Custom utility with native `Intl.RelativeTimeFormat` | No dependencies, full control |
| Navigation | Add new Link + Route following existing pattern | Consistency, simplicity |
| Visual indicators | Color-coded badges (green/amber/red/gray/blue) | Semantic, accessible, quick scanning |
| API endpoint | Extend existing `/admin/scheduler/status` | Reuse, backward compatible |

All research items resolved. Ready for Phase 1 design.
