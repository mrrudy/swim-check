# Implementation Plan: Midnight Booking Data Rescrape

**Branch**: `003-midnight-rescrape` | **Date**: 2026-02-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-midnight-rescrape/spec.md`

## Summary

Implement automatic scheduling to ensure pool booking data is refreshed daily after midnight. The system will:
1. Automatically trigger rescrapes for all pools after midnight when running
2. Check on startup if today's data exists and scrape if missing
3. Provide an API endpoint for manual force-rescraping

Technical approach uses native Node.js setTimeout/setInterval for scheduling (no external dependencies), SQLite for state persistence, and in-memory locks for concurrency control.

## Technical Context

**Language/Version**: TypeScript 5.3.3, Node.js 20 LTS (ES2022 target)
**Primary Dependencies**: Express.js 4.18.2, sql.js 1.10.0, cheerio, pdf-parse
**Storage**: SQLite via sql.js (`./swim-check.db`)
**Testing**: Vitest 1.2.0
**Target Platform**: Node.js server (Linux/Windows)
**Project Type**: Web application (monorepo with packages/backend, packages/frontend)
**Performance Goals**: All pools scraped within 25 minutes after midnight (SC-001)
**Constraints**: Sequential scraping with 2-6 second delays between pools
**Scale/Scope**: 3 configured pools, single-instance application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Test-First Development | ✅ PASS | Tests will be written before implementation per tasks.md ordering |
| II. Readable Code | ✅ PASS | Clear service separation: scheduler, orchestrator, state tracking |
| III. Simplicity | ✅ PASS | Native setTimeout (no cron library), SQLite (existing DB), sequential scraping |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/003-midnight-rescrape/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Research decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Usage guide
├── contracts/
│   └── openapi.yaml     # API contract
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Server entry (add scheduler init)
│   │   ├── config.ts                   # Environment config (add scheduler vars)
│   │   ├── api/
│   │   │   ├── routes.ts               # Route setup
│   │   │   ├── admin.ts                # NEW: Admin routes (rescrape, status)
│   │   │   └── ... (existing routes)
│   │   ├── db/
│   │   │   ├── schema.ts               # DB schema (add scrape_jobs table)
│   │   │   ├── queries.ts              # Existing queries
│   │   │   └── scrapeJobs.ts           # NEW: Scrape job queries
│   │   ├── scrapers/
│   │   │   ├── types.ts                # Scraper interfaces
│   │   │   ├── registry.ts             # Scraper registry
│   │   │   └── pools/                  # Pool-specific scrapers
│   │   └── services/
│   │       ├── availability.ts         # Existing availability service
│   │       ├── cache.ts                # Existing cache service
│   │       ├── scheduler.ts            # NEW: Midnight scheduler service
│   │       └── scrapeOrchestrator.ts   # NEW: Multi-pool scrape coordination
│   └── tests/
│       ├── unit/
│       │   ├── scheduler.test.ts       # NEW: Scheduler unit tests
│       │   └── scrapeOrchestrator.test.ts # NEW: Orchestrator tests
│       └── integration/
│           └── admin-rescrape.test.ts  # NEW: Admin API integration tests
├── frontend/
│   └── ... (no changes)
└── shared/
    └── src/types/
        ├── models.ts                   # Add ScrapeJob, SchedulerStatus types
        └── api.ts                      # Add admin API response types
```

**Structure Decision**: Web application pattern. Backend changes only - new services and API routes. No frontend changes required. Shared types extended for new entities.

## Complexity Tracking

> No violations - table not needed.

## Phase Artifacts

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 | [research.md](research.md) | ✅ Complete |
| 1 | [data-model.md](data-model.md) | ✅ Complete |
| 1 | [contracts/openapi.yaml](contracts/openapi.yaml) | ✅ Complete |
| 1 | [quickstart.md](quickstart.md) | ✅ Complete |
| 2 | tasks.md | Pending (`/speckit.tasks`) |

## Implementation Summary

### New Files to Create

1. **`src/services/scheduler.ts`** - Core scheduling logic
   - Calculate time until next midnight
   - Set/clear timeouts
   - Trigger startup check
   - Track scheduler state

2. **`src/services/scrapeOrchestrator.ts`** - Multi-pool coordination
   - Sequential pool iteration
   - Retry logic with backoff
   - Concurrency locks
   - Result aggregation

3. **`src/db/scrapeJobs.ts`** - State persistence
   - CRUD for scrape_jobs table
   - Query pools needing scrape
   - Update scrape status

4. **`src/api/admin.ts`** - Admin endpoints
   - POST /admin/rescrape
   - GET /admin/scheduler/status

### Files to Modify

1. **`src/db/schema.ts`** - Add scrape_jobs table
2. **`src/index.ts`** - Initialize scheduler after pool seeding
3. **`src/config.ts`** - Add scheduler config variables
4. **`packages/shared/src/types/models.ts`** - Add TypeScript interfaces

### Test Files to Create

1. **`tests/unit/scheduler.test.ts`** - Scheduler timing tests
2. **`tests/unit/scrapeOrchestrator.test.ts`** - Orchestration tests
3. **`tests/integration/admin-rescrape.test.ts`** - API endpoint tests

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ | Test files listed; will write before implementation |
| II. Readable | ✅ | Clear separation: scheduler (timing) vs orchestrator (execution) |
| III. Simplicity | ✅ | No new dependencies; reuses existing patterns |

**Design passes all gates. Ready for task generation.**
