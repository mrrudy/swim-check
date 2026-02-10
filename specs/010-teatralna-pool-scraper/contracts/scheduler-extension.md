# Contract: Scheduler Extension for Per-Pool Intervals

## PoolScraperMetadata Extension

```typescript
interface PoolScraperMetadata {
  poolId: string;
  name: string;
  version: string;
  sourceUrls?: SourceLink[];
  scrapeIntervalHours?: number;  // NEW: optional per-pool scrape interval
}
```

## Scheduler Behavior Change

### Current behavior (midnight-only):
```
startScheduler(callback) → setTimeout at midnight → callback() → reschedule
```

### New behavior (midnight + per-pool intervals):
```
startScheduler(callback) → setTimeout at midnight → callback() → reschedule
                          + for each pool with scrapeIntervalHours:
                            setInterval(scrapePool(poolId), intervalHours * 3600000)
```

### startPerPoolIntervals()

**New function** in `scheduler.ts`:

```typescript
function startPerPoolIntervals(scrapeCallback: (poolId: string) => void): void
```

**Behavior**:
1. Iterate all registered scrapers via `scraperRegistry.getAll()`
2. For each scraper with `scrapeIntervalHours` defined:
   - Calculate interval in ms: `scrapeIntervalHours * 60 * 60 * 1000`
   - Start `setInterval` that calls `scrapeCallback(poolId)`
   - Store interval reference for cleanup via `stopScheduler()`
3. Log each registered per-pool interval

**Called by**: `startScheduler()` after setting up midnight schedule

### stopScheduler() modification

Clear all per-pool intervals in addition to the midnight timeout.

### getSchedulerState() modification

Include per-pool interval information in the state response.

## Concurrency Safety

The existing `ScrapeState` concurrency prevention handles overlapping interval-based and midnight-based scrapes:
- `setScrapeInProgress(poolId)` returns `false` if pool is already being scraped
- `isAnyScrapeInProgress()` prevents global overlaps
- Per-pool interval scrapes use `scrapePool()` which acquires locks before proceeding
