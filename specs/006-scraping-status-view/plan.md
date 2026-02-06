# Implementation Plan: Scraping Status View

**Branch**: `006-scraping-status-view` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-scraping-status-view/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a read-only "Scraping Status" tab to the frontend application displaying the last scraping status for each configured swimming pool. The view shows pool names, last scrape timestamps (human-readable), status indicators (success/failure/stale/never), and clickable source links used for scraping. Visual indicators highlight pools with failed or stale scrapes. Backend API endpoint already exists (`/api/v1/admin/scheduler/status`); this feature primarily requires frontend implementation with minor backend extension to include source URLs.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (Node.js 20 LTS for backend, React 18 for frontend)
**Primary Dependencies**: React 18.2.0, React Router DOM 6.21.3, Vite 5.0.12, Express.js 4.18.2
**Storage**: SQLite via sql.js (./swim-check.db) - existing scrape_jobs table
**Testing**: Vitest, @testing-library/react (frontend); Node test runner (backend)
**Target Platform**: Web browser (desktop/mobile responsive)
**Project Type**: Web application (monorepo with packages/backend, packages/frontend, packages/shared)
**Performance Goals**: Page load < 3 seconds (per SC-001)
**Constraints**: Read-only view, no edit capabilities; stale threshold = 24 hours
**Scale/Scope**: ~3-5 swimming pools, single user preferences

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

#### I. Test-First Development (NON-NEGOTIABLE)
- ✅ **Compliant**: Tests will be written before implementation for:
  - Frontend component rendering tests (ScrapingStatusView)
  - API service function tests (fetchScrapingStatus)
  - Time formatting utility tests (relative timestamps)
  - Visual indicator logic tests (status → color/icon)

#### II. Readable Code
- ✅ **Compliant**: Feature is straightforward with clear naming:
  - `ScrapingStatusView` page component
  - `ScrapingStatusCard` or `ScrapingStatusRow` for pool entries
  - Clear separation: API fetching → data transformation → display

#### III. Simplicity
- ✅ **Compliant**: Minimal implementation approach:
  - Reuse existing `/admin/scheduler/status` API endpoint
  - Extend existing types rather than creating new ones
  - Single new page component with simple list rendering
  - Use existing navigation patterns

**Pre-Design Gate Status**: ✅ PASS - All principles satisfied

---

### Post-Design Check (Phase 1)

#### I. Test-First Development (NON-NEGOTIABLE)
- ✅ **Compliant**: Design artifacts support test-first approach:
  - Data model defines clear types for testing (`SourceLink`, `ScrapingStatusType`)
  - OpenAPI contract enables contract testing
  - Utility functions (`formatScrapedAt`, `getStatusType`) are pure functions, easily unit tested
  - Component structure allows isolated testing

#### II. Readable Code
- ✅ **Compliant**: Design maintains readability:
  - Type extensions are minimal and well-documented
  - State transitions are clearly diagrammed in data-model.md
  - API contract is self-documenting with examples
  - Implementation order in quickstart.md is logical

#### III. Simplicity
- ✅ **Compliant**: Design avoids unnecessary complexity:
  - No new database tables or migrations required
  - Extends 3 existing interfaces rather than creating parallel structures
  - Uses native `Intl.RelativeTimeFormat` instead of adding dependencies
  - Single new page component, no complex component hierarchy
  - No state management library needed (simple fetch-on-mount pattern)

**Post-Design Gate Status**: ✅ PASS - All principles maintained through design phase

## Project Structure

### Documentation (this feature)

```text
specs/006-scraping-status-view/
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
├── backend/
│   └── src/
│       ├── api/
│       │   └── admin.ts          # Extend to include source URLs
│       ├── scrapers/
│       │   ├── registry.ts       # Source URLs per scraper
│       │   └── types.ts          # Add sourceUrls to metadata
│       └── db/
│           └── scrapeJobs.ts     # Existing scrape job queries
├── frontend/
│   └── src/
│       ├── pages/
│       │   └── ScrapingStatus.tsx    # NEW: Main status view
│       ├── components/
│       │   └── ScrapingStatusCard.tsx # NEW: Pool status display
│       ├── services/
│       │   └── api.ts            # Add getScrapingStatus()
│       └── App.tsx               # Add route and navigation tab
└── shared/
    └── src/
        └── types/
            └── api.ts            # Extend PoolScrapeStatusResponse
```

**Structure Decision**: Web application (monorepo) - packages/frontend for UI, packages/backend for API extension, packages/shared for type definitions. This follows the existing project structure established by previous features.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

No complexity violations identified. The feature follows existing patterns and uses minimal new code.
