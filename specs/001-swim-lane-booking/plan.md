# Implementation Plan: Swim Lane Booking Checker

**Branch**: `001-swim-lane-booking` | **Date**: 2026-01-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-swim-lane-booking/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A web application that allows users to check swimming lane availability at their preferred pools during specific time slots. The system retrieves booking data from pool websites via server-side web scraping, caches the data until refresh is needed, and exposes both a web UI and REST API for viewing availability.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 LTS) for backend; TypeScript for frontend
**Primary Dependencies**: Express.js (REST API), React 18 (frontend), Cheerio/Puppeteer (web scraping)
**Storage**: SQLite (cached pool data, user preferences, scraper metadata)
**Testing**: Vitest (unit/integration), Playwright (E2E), Testing Library (React components)
**Target Platform**: Web browser (frontend), Node.js server (backend), deployable via Docker
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Lane availability displayed within 10 seconds (SC-001), app launch <3 seconds (SC-005)
**Constraints**: Single-server deployment, server-side scraping with caching, graceful scraper failure handling
**Scale/Scope**: Personal/Small scale (<100 users), single instance deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Gate (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | ✅ PASS | Plan includes test infrastructure (Vitest, Playwright, Testing Library). Tasks will be structured with tests first. |
| II. Readable Code | ✅ PASS | TypeScript provides type safety and self-documenting code. Modular scraper architecture supports clear separation of concerns. |
| III. Simplicity | ✅ PASS | Single-server SQLite deployment is the simplest viable solution. No premature abstractions planned. |

**Gate Result**: PASS - Proceed to Phase 0

### Post-Design Gate (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | ✅ PASS | Data model includes testable validation rules. API contracts define clear behavior for test cases. Scraper interface enables mocked testing. |
| II. Readable Code | ✅ PASS | Shared types package ensures consistent naming. Modular scraper architecture with explicit interface contract. OpenAPI spec documents all endpoints. |
| III. Simplicity | ✅ PASS | pnpm workspaces (minimal monorepo tooling). SQLite with direct better-sqlite3 (no ORM). Cheerio-first scraping (escalate only if needed). REST API (no GraphQL). |

**Gate Result**: PASS - Proceed to Phase 2 (task generation)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── shared/                        # @swim-check/shared - Shared types
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Re-exports all types
│       └── types/
│           ├── models.ts          # SwimmingPool, Lane, LaneBooking, etc.
│           └── api.ts             # Request/Response types
│
├── backend/                       # @swim-check/backend - Express API + Scrapers
│   ├── package.json
│   ├── tsconfig.json
│   ├── swim-check.db              # SQLite database file
│   └── src/
│       ├── index.ts               # Express server entry point
│       ├── api/
│       │   ├── routes.ts          # Route definitions
│       │   ├── pools.ts           # Pool endpoints
│       │   ├── availability.ts    # Availability endpoints
│       │   ├── favorites.ts       # Favorites endpoints
│       │   └── preferences.ts     # Preferences endpoints
│       ├── db/
│       │   ├── schema.ts          # Database initialization
│       │   ├── migrations/        # SQLite migrations
│       │   └── queries.ts         # Query functions
│       ├── scrapers/
│       │   ├── types.ts           # PoolScraper interface
│       │   ├── registry.ts        # ScraperRegistry class
│       │   └── pools/             # Individual pool scrapers
│       │       └── example/       # Example scraper module
│       │           ├── index.ts
│       │           └── parser.ts
│       └── services/
│           ├── availability.ts    # Availability service (cache + scrape)
│           ├── cache.ts           # Cache service
│           └── time-slot.ts       # Smart default time slot logic
│
└── frontend/                      # @swim-check/frontend - React UI
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx               # React entry point
        ├── App.tsx                # Root component
        ├── components/
        │   ├── PoolCard.tsx       # Pool display card
        │   ├── LaneGrid.tsx       # Lane availability grid
        │   ├── TimeSlotPicker.tsx # Time slot selection
        │   └── FavoriteButton.tsx # Add/remove favorite
        ├── pages/
        │   ├── Home.tsx           # Favorites + search
        │   ├── PoolDetail.tsx     # Pool availability view
        │   └── Search.tsx         # Pool search
        └── services/
            └── api.ts             # API client

tests/                             # Test files (mirrors packages structure)
├── backend/
│   ├── unit/
│   │   ├── scrapers/
│   │   └── services/
│   └── integration/
│       └── api/
└── frontend/
    └── components/
```

**Structure Decision**: Web application with pnpm workspaces monorepo. Three packages:
- `@swim-check/shared`: Shared TypeScript types (zero runtime, compile-time only)
- `@swim-check/backend`: Express.js API server with SQLite and modular scrapers
- `@swim-check/frontend`: React SPA with Vite for development

## Complexity Tracking

> **No violations - all Constitution principles satisfied**

The design uses the simplest viable approach for each component:
- pnpm workspaces instead of Turborepo
- SQLite + better-sqlite3 instead of ORM or PostgreSQL
- Cheerio instead of Puppeteer (until JavaScript rendering required)
- REST instead of GraphQL
- Direct type sharing instead of code generation
