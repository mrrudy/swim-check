# Research: Swim Lane Booking Checker

**Feature Branch**: `001-swim-lane-booking`
**Date**: 2026-01-30

## Executive Summary

This research addresses the technical decisions needed for building a swim lane booking checker with server-side web scraping, caching, and both web UI and REST API.

---

## 1. Web Scraping Strategy

### Decision: Cheerio-first with Puppeteer fallback

**Rationale**: Most pool facility websites are server-side rendered with availability data embedded in HTML. Cheerio is significantly faster (~0.001s vs browser startup overhead) and uses minimal memory.

**Alternatives Considered**:
- Puppeteer-only: Slower, higher resource usage, overkill for static HTML
- Playwright: Better cross-browser support but unnecessary complexity for scraping
- jsdom: Lighter than Puppeteer but less robust for edge cases

**Implementation Guidance**:
- Start with Cheerio for all scrapers
- Only escalate to Puppeteer if a pool website requires JavaScript execution
- Consider hybrid: Puppeteer renders, Cheerio parses

### Decision: Rate limiting with exponential backoff

**Configuration**:
```typescript
interface ScraperConfig {
  minDelayMs: 2000;       // 2 seconds minimum between requests
  maxDelayMs: 6000;       // 6 seconds max for randomization
  requestTimeoutMs: 30000; // Abort after 30 seconds
  maxRetries: 3;          // Retry limit
}
```

**Rationale**: Pool websites don't typically block moderate scraping (1 request per facility every 5-10 minutes), but polite scraping maintains ethical standing and avoids IP bans.

**Tools Selected**:
- `p-queue`: Concurrent request queuing with rate limiting
- `axios-retry`: Built-in retry with exponential backoff

### Decision: Cache-aside pattern with 5-minute TTL

**Rationale**: Availability data changes infrequently. Caching for 5 minutes reduces pool website load and ensures consistent response times.

**Cache Configuration**:
```typescript
const cacheTTL = {
  availabilityCheck: 5 * 60,    // 5 minutes (user is checking now)
  dailySchedule: 60 * 60,       // 1 hour (less urgent)
  facilityInfo: 24 * 60 * 60,   // 24 hours (static data)
};
```

**Storage**: SQLite for persistence (survives server restart)

---

## 2. Modular Scraper Architecture

### Decision: Plugin pattern with Registry

**Pattern Components**:
1. **PoolScraper Interface**: Contract all scrapers implement
2. **ScraperRegistry**: Central registry for discovery and management
3. **Dynamic Loading**: Glob-based module discovery

**Interface Contract**:
```typescript
interface PoolScraper {
  poolId: string;
  name: string;
  version: string;

  fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]>;
  isHealthy(): Promise<boolean>;
  handleError(error: Error): ErrorResponse;
}
```

**Rationale**:
- Each scraper is independently testable
- New scrapers added without modifying core logic
- Scrapers know their own failure modes
- Supports lazy loading for performance

**Alternatives Considered**:
- Dependency injection: More boilerplate, less natural for plugins
- Factory pattern alone: Doesn't support dynamic discovery
- Strategy pattern: Less suited for plugin-like extension

### Decision: One folder per scraper module

**Structure**:
```
src/scrapers/
├── pool-a/
│   ├── index.ts          # Exports PoolScraper implementation
│   ├── parser.ts         # HTML parsing logic
│   └── pool-a.test.ts    # Scraper tests with mocked HTML
├── pool-b/
│   └── ...
└── registry.ts           # ScraperRegistry class
```

**Rationale**: Clear separation, isolated testing, easy maintenance.

---

## 3. Project Structure

### Decision: pnpm workspaces monorepo

**Rationale**: Native workspace support, fast installation, excellent TypeScript integration. Simpler than Turborepo for a personal/small-scale project.

**Alternatives Considered**:
- npm/yarn workspaces: Slower, less efficient disk usage
- Turborepo: More powerful but unnecessary complexity for this scale
- Separate repos: Harder to share types, more maintenance

### Decision: Shared types package

**Structure**:
```
packages/
├── shared/           # @swim-check/shared
│   └── src/
│       ├── types/    # Shared TypeScript types
│       └── utils/    # Shared utilities
├── backend/          # @swim-check/backend
│   └── src/
│       ├── api/      # Express routes
│       ├── scrapers/ # Pool scrapers
│       ├── services/ # Business logic
│       └── db/       # SQLite access
└── frontend/         # @swim-check/frontend
    └── src/
        ├── components/
        ├── pages/
        └── services/  # API client
```

**Rationale**: Zero runtime cost, single source of truth for types, compile-time validation.

### Decision: better-sqlite3 for SQLite access

**Rationale**: Synchronous API is simpler for this use case, excellent performance, well-maintained.

**Alternatives Considered**:
- sql.js: WASM-based, slower, more complex
- Drizzle ORM: Nice but adds abstraction layer not needed yet
- Prisma: Heavy, async-only, overkill for this scale

---

## 4. API Design

### Decision: REST API with JSON

**Rationale**: Standard, simple, excellent caching with HTTP headers, well-suited for availability queries.

**Alternatives Considered**:
- GraphQL: Overkill for availability queries, adds complexity
- tRPC: TypeScript-specific, less standard
- gRPC: Protocol buffers unnecessary for this use case

### Decision: Express.js

**Rationale**: Lightweight, simple, huge ecosystem, well-documented.

**Alternatives Considered**:
- Fastify: Faster but more complex configuration
- NestJS: Too heavy for personal project scale
- Hono: Newer, less ecosystem support

---

## 5. Frontend

### Decision: React 18 with Vite

**Rationale**: Fast development loop (<1s HMR), modern tooling, React's component model fits UI well.

**Alternatives Considered**:
- Vue 3: Good alternative but team familiarity matters
- Svelte: Lighter but smaller ecosystem
- Create React App: Slower, deprecated in favor of Vite

---

## 6. Testing Strategy

### Decision: Vitest + Testing Library + Playwright

**Breakdown**:
- **Vitest**: Unit and integration tests (fast, Vite-native)
- **Testing Library**: React component testing
- **Playwright**: E2E testing

**Scraper Testing Strategy**:
- Mock HTTP responses with stored HTML fixtures
- No real network calls in tests
- Separate fixtures per pool scraper

**Rationale**: Fast test execution, good developer experience, matches Vite ecosystem.

---

## 7. Implementation Priority

### Phase 1 (MVP)
- Cheerio-based scrapers
- SQLite caching with 5-minute TTL
- Basic Express API
- Simple React UI

### Phase 2 (Resilience)
- Puppeteer support for JS-heavy sites
- Exponential backoff retry
- Comprehensive error handling
- Health check endpoints

### Phase 3 (Polish)
- User preferences persistence
- Favorite pools management
- Smart default time slots

---

## Constitution Alignment

| Principle | Alignment |
|-----------|-----------|
| **Test-First** | Scraper tests with mocked HTML before implementation |
| **Readable Code** | Named interfaces, modular structure, clear separation |
| **Simplicity** | Cheerio-first, SQLite, pnpm workspaces - minimal complexity |

---

## Sources

- ZenRows: Web Scraping Best Practices 2026
- ScrapingBee: Web Scraping Best Practices
- Refactoring.guru: Adapter Pattern in TypeScript
- Frontend Masters: Type Registry Pattern
- DEV Community: Plugin System in TypeScript
- LogRocket: Extending Types with Interfaces
- Scrapfly: Web Scraping with TypeScript Guide
- GitHub: Crawlee - Node.js Web Scraping Library
