# Quickstart: Midnight Booking Data Rescrape

**Feature Branch**: `003-midnight-rescrape`

## Overview

This feature adds automatic scheduling to refresh pool booking data:
1. **Midnight refresh**: Automatically scrapes all pools after midnight
2. **Startup check**: Scrapes on application start if today's data is missing
3. **Manual trigger**: API endpoint for on-demand rescraping

## Prerequisites

- Node.js 20 LTS
- Existing swim-check backend running
- Configured pool scrapers (Aquapark, Ślęża, etc.)

## Quick Test

### 1. Start the application

```bash
cd packages/backend
npm run dev
```

The scheduler initializes automatically. Check logs for:
```
[Scheduler] Initialized - next midnight run at 2026-02-02T00:00:00
[Scheduler] Startup check: Today's scrape not found, triggering...
```

### 2. Check scheduler status

```bash
curl http://localhost:3000/api/v1/admin/scheduler/status
```

Response:
```json
{
  "isRunning": true,
  "nextScheduledRun": "2026-02-02T00:00:00.000Z",
  "lastRunTimestamp": "2026-02-01T08:15:30.000Z",
  "poolStatuses": [
    {
      "poolId": "00000000-0000-0000-0000-000000000002",
      "poolName": "Aquapark Wrocław",
      "lastScrapeDate": "2026-02-01",
      "lastScrapeStatus": "success",
      "inProgress": false
    }
  ]
}
```

### 3. Trigger manual rescrape

**All pools:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/rescrape
```

**Specific pool:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/rescrape?poolId=00000000-0000-0000-0000-000000000002"
```

Response:
```json
{
  "message": "Rescrape started",
  "pools": [
    { "poolId": "00000000-0000-0000-0000-000000000002", "poolName": "Aquapark Wrocław" }
  ]
}
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SCHEDULER_ENABLED` | `true` | Enable/disable automatic scheduling |
| `SCRAPE_RETRY_COUNT` | `3` | Max retries per failed scrape |
| `SCRAPE_DELAY_MIN_MS` | `2000` | Min delay between pool scrapes |
| `SCRAPE_DELAY_MAX_MS` | `6000` | Max delay between pool scrapes |

## Key Files

| File | Purpose |
|------|---------|
| `src/services/scheduler.ts` | Scheduler service (midnight timing, startup check) |
| `src/services/scrapeOrchestrator.ts` | Coordinates scraping across all pools |
| `src/api/admin.ts` | Admin API routes (rescrape, status) |
| `src/db/scrapeJobs.ts` | Database queries for scrape state |

## Testing

Run tests:
```bash
npm test -- --grep "scheduler"
```

Key test scenarios:
- Midnight trigger fires at correct time
- Startup detects missing today's scrape
- Concurrent scrape prevention works
- Failed scrapes are retried with backoff
- Force rescrape returns 409 when in progress

## Troubleshooting

### Scrape not triggering at midnight
- Check server timezone matches expected local time
- Verify `SCHEDULER_ENABLED=true`
- Check logs for scheduler initialization

### "Scrape in progress" error on manual trigger
- Another scrape is running; wait for completion
- Check `GET /admin/scheduler/status` for `inProgress` pools

### Scrape fails repeatedly
- Check scraper health: `GET /health`
- Verify network access to pool websites
- Check for rate limiting (2-6 second delays between requests)
