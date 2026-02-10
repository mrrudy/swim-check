# Quickstart: Teatralna Basen 1 Pool Scraper

## Prerequisites

- Node.js 20 LTS
- npm (workspace-aware)
- Internet access to `klient.spa.wroc.pl`

## Setup

```bash
# Install dependencies (from repo root)
npm install

# Build shared types
npm run build -w packages/shared

# Build backend
npm run build -w packages/backend
```

## Run

```bash
# Start the server (seeds Teatralna pool automatically)
npm run dev -w packages/backend
```

The Teatralna Basen 1 pool is automatically seeded on startup with:
- Pool ID: `00000000-0000-0000-0000-000000000004`
- 5 lanes (lane numbers 1-5)
- Scraper registered with 3-hour interval

## Verify

```bash
# Check pool appears in the list
curl http://localhost:3000/api/v1/pools

# Check availability (replace date with today)
curl "http://localhost:3000/api/v1/pools/00000000-0000-0000-0000-000000000004/availability?date=2026-02-09&startTime=06:00&endTime=22:00"

# Trigger manual scrape
curl -X POST "http://localhost:3000/api/v1/admin/rescrape?poolId=00000000-0000-0000-0000-000000000004"

# Check scheduler status (shows per-pool interval)
curl http://localhost:3000/api/v1/admin/scheduler/status
```

## Test

```bash
# Run all tests
npm test

# Run only Teatralna scraper tests
npx vitest run packages/backend/tests/scrapers/teatralna-basen1/
```

## Key Configuration (in config.ts)

| Parameter | Default | Description |
|-----------|---------|-------------|
| POOL_ID | `00000000-...-000000000004` | UUID for this pool |
| SCHEDULE_URL | `https://klient.spa.wroc.pl/index.php?s=basen_1` | Booking page URL |
| TOTAL_SPOTS | 30 | Maximum swimming spots |
| SPOTS_PER_LANE | 6 | Spots per conceptual lane |
| SCRAPE_INTERVAL_HOURS | 3 | How often to scrape (hours) |

## Troubleshooting

- **Scraper returns 0 availability for all slots**: Check if the current time is past all slot times (past slots show as inactive). Verify with `curl https://klient.spa.wroc.pl/index.php?s=basen_1`.
- **Health check fails**: Verify `klient.spa.wroc.pl` is reachable. The site may have occasional downtime.
- **Parse errors**: The HTML structure may have changed. Compare current page HTML with the test fixture in `tests/scrapers/teatralna-basen1/fixtures/basen1-schedule.html`.
