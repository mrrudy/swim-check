# Research Summary: TypeScript Monorepo Best Practices

**Project**: Swim Lane Booking Checker
**Date**: 2026-01-30
**Scope**: Full-stack TypeScript monorepo with Express.js, React, SQLite, and shared types

---

## Key Findings

### 1. Monorepo Strategy

**Recommended**: **pnpm workspaces** (simple approach for small-medium projects)

#### Why this choice:
- ✅ Lightweight and fast (disk deduplication via content-addressable store)
- ✅ Native monorepo support without extra tools
- ✅ Works seamlessly with TypeScript path aliases
- ✅ No learning curve (familiar npm/yarn commands)
- ✅ Easy to graduate to Turborepo if needed

#### Alternatives considered:
| Tool | Use when | Avoided because |
|------|----------|-----------------|
| **Turborepo** | 10+ packages, CI optimization needed | Overkill for personal projects |
| **npm/yarn workspaces** | Existing npm/yarn investment | pnpm is faster and more efficient |
| **Lerna** | Managing versioning across packages | Adds abstraction, maintenance burden |
| **Monorepo.sh** | Maximum simplicity | Lacks TypeScript integration |

---

### 2. Shared Types Pattern

**Recommended**: **Dedicated types package** (@shared/types)

#### Why this choice:
- ✅ Single source of truth for API contracts
- ✅ Type safety across entire stack (frontend/backend)
- ✅ Zero runtime overhead (types stripped during compilation)
- ✅ IDE support for automatic refactoring
- ✅ No build-time code generation needed

#### Example usage:
```typescript
// Backend and frontend both import from same package
import type { GetAvailabilityResponse } from "@shared/types";
```

#### Alternatives considered:
| Solution | Pros | Cons | When to use |
|----------|------|------|------------|
| **Shared types package** | Simple, zero config | Manual sync | Current recommendation |
| **OpenAPI/Swagger generation** | Industry standard, scalable | Extra build step | When API grows to 50+ endpoints |
| **tRPC** | Full type safety, real-time capable | Requires backend changes | When internal APIs + real-time needed |
| **GraphQL Codegen** | Powerful, handles subscriptions | Overkill for simple REST | When complex data querying required |

**Verdict**: Start with shared types package. Migrate to OpenAPI only if API complexity justifies it.

---

### 3. SQLite Database Library

**Recommended**: **better-sqlite3** (with optional Drizzle-orm layer later)

#### Comparison Matrix:

| Feature | better-sqlite3 | sql.js | drizzle-orm | prisma |
|---------|---|---|---|---|
| **Speed** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Fast | ⭐⭐⭐ Medium |
| **API Style** | Sync (simple) | Sync | Type-safe ORM | ORM + migrations |
| **Learning Curve** | Easy | Medium | Medium | Steep |
| **Overhead** | None | None | Thin | Heavy |
| **Use Case** | Small projects | Browser/WASM | Large projects | Enterprise |
| **Bundle Size** | 1.8 MB | 800 KB | Varies | Large |

#### Why better-sqlite3:
- ✅ Synchronous API = simpler error handling in scrapers
- ✅ Fastest query execution (no async overhead)
- ✅ Direct SQL control (easier debugging)
- ✅ Perfect for read-heavy workload (pool availability)
- ✅ Minimal abstraction (transparent)

#### When to graduate:
- Consider **drizzle-orm** if: Complex queries, type-safe SQL, 100+ queries
- Consider **prisma** if: Enterprise features, automatic migrations, team onboarding

---

### 4. Project Structure

**Recommended minimal structure** (for small projects):

```
swim-check/
├── apps/
│   ├── backend/           # Express.js API
│   └── frontend/          # React + Vite
├── packages/
│   ├── shared/            # Shared types (@shared/types)
│   └── db/                # Database layer (@db/database)
└── pnpm-workspace.yaml
```

#### Benefits:
- ✅ Clear separation of concerns
- ✅ Easy to add new packages without restructuring
- ✅ Scalable to larger projects
- ✅ Avoids deeply nested directories

#### Anti-patterns avoided:
- ❌ Monolithic backend (hard to test, scale)
- ❌ Deep nesting (hard to navigate)
- ❌ Shared code in root (unclear ownership)
- ❌ Missing workspace definition (no type sharing)

---

### 5. Frontend Framework

**Recommended**: **React 18 with Vite** (not Create React App)

#### Why Vite over CRA:

| Metric | Vite | CRA |
|--------|------|-----|
| Development build | <1 second | 30-50 seconds |
| Dev server startup | Instant | Slow |
| Hot reload | <100ms | 1-3 seconds |
| Config | Transparent | Hidden/ejected |
| Bundle size | Smaller | Larger |
| Tree-shaking | Excellent | Good |

#### Vite setup:
```bash
# Uses ES modules native to browsers
# Type-safe via TypeScript
# Can proxy to backend: /api → http://localhost:3000/api
```

---

### 6. API Architecture Pattern

**Recommended**: **REST with shared TypeScript types** (not GraphQL/gRPC)

#### Why REST for this project:
- ✅ Simple HTTP methods map to pool/availability operations
- ✅ Easy to cache (HTTP caching headers)
- ✅ Stateless by design
- ✅ Browser-friendly (no special clients needed)
- ✅ Easy to test (curl, Postman)

#### API endpoints for swim-check:
```typescript
GET  /api/pools              // List all pools
GET  /api/pools/:id          // Get pool details
POST /api/availability       // Get availability for slot
POST /api/favorites          // Add favorite pool
DELETE /api/favorites/:id    // Remove favorite pool
POST /api/scrape/:poolId     // Manual scrape trigger
```

---

### 7. Scraper Architecture

**Recommended**: **Strategy pattern with Abstract base class**

#### Why this pattern:
- ✅ Easy to add new pool scrapers (create new file, implement class)
- ✅ Each scraper is isolated (one pool = one class)
- ✅ Common logic in base class (fetching, logging, error handling)
- ✅ Factory pattern for instantiation

#### Adding a new pool (typical workflow):

1. **Analyze pool website** (5 minutes)
   - Look at booking page HTML structure
   - Identify CSS selectors for lanes/availability

2. **Create scraper** (15 minutes)
   ```typescript
   class PoolXScraper extends BasePoolScraper {
     async scrape(date, timeSlots) {
       // Implement pool-specific logic
     }
   }
   ```

3. **Register** (1 minute)
   ```typescript
   SCRAPER_REGISTRY["pool-x"] = PoolXScraper;
   ```

4. **Test** (5 minutes)
   ```bash
   curl -X POST http://localhost:3000/api/scrape/pool-x
   ```

---

### 8. Database Migrations

**Recommended**: **Simple file-based SQL migrations** (not heavy ORM migrations)

#### Why this approach:
- ✅ Transparent SQL (easy to debug)
- ✅ No ORM magic or special syntax
- ✅ Version tracking built-in
- ✅ Works with any database client

#### Migration structure:
```
packages/db/src/migrations/sql/
├── 001_initial_schema.sql
├── 002_add_scraper_logs.sql
└── 003_add_indices.sql
```

#### Run automatically:
```typescript
// Called on app startup
initializeDatabase(); // Runs all pending migrations
```

---

## Implementation Timeline

### Phase 1: Core Setup (2-3 hours)
- [ ] Initialize pnpm workspace
- [ ] Create backend (Express + basic routes)
- [ ] Create frontend (React + Vite)
- [ ] Create shared types package
- [ ] Set up database layer with better-sqlite3

### Phase 2: Feature Development (1-2 days)
- [ ] Implement pool search/listing
- [ ] Add availability checking API
- [ ] Build React UI components
- [ ] Add localStorage for favorites
- [ ] Implement default time slot logic

### Phase 3: Scrapers (varies)
- [ ] Analyze first pool website
- [ ] Build first scraper
- [ ] Add scheduled scraper job (node-cron)
- [ ] Repeat for each pool

### Phase 4: Polish (1 day)
- [ ] Error handling and edge cases
- [ ] Logging and monitoring
- [ ] Testing (unit + integration)
- [ ] Deployment setup

---

## Technology Stack Decision Matrix

| Layer | Technology | Rationale | Alternatives |
|-------|-----------|-----------|--------------|
| **Monorepo** | pnpm workspaces | Simple, fast, native | Turborepo, npm/yarn, Lerna |
| **Backend** | Express.js | Lightweight, simple REST | Fastify, Hapi, NestJS |
| **Frontend** | React 18 + Vite | Fast dev loop, ecosystem | Vue + Vite, Svelte, Remix |
| **Database** | SQLite + better-sqlite3 | Simple, fast, synchronous | PostgreSQL + Prisma, Drizzle |
| **Shared Types** | TypeScript package | Zero runtime cost, simple | OpenAPI generation, tRPC |
| **API Pattern** | REST + JSON | Simple, standard, cacheable | GraphQL, gRPC, WebSockets |
| **Scraping** | Cheerio + fetch | HTML parsing, no headless browser | Puppeteer, Playwright, JSdom |

---

## Common Pitfalls to Avoid

### 1. Over-engineering
❌ Don't use: GraphQL, WebSockets, Kafka, Docker Compose, Kubernetes initially
✅ Do use: Simple REST, SQLite, pnpm workspaces, direct HTTP

### 2. Async complexity
❌ Don't use: Async database (sql.js, sqlite3 with callbacks)
✅ Do use: better-sqlite3 (synchronous, simpler error handling)

### 3. API contract drift
❌ Don't do: Separate API types in frontend/backend
✅ Do: Share types via @shared/types package

### 4. Inflexible scraper architecture
❌ Don't do: Hardcode scraper logic in main service
✅ Do: Create scraper hierarchy, use factory pattern

### 5. Missing error handling
❌ Don't do: Silent failures in scrapers
✅ Do: Log all executions, track success rate, retry logic

---

## Quick Reference: File Organization

```
swim-check/
│
├── Root Files
│   ├── package.json              # Workspace commands
│   ├── pnpm-workspace.yaml       # Workspace config
│   ├── tsconfig.json             # Shared TS config
│   └── MONOREPO_ARCHITECTURE.md  # This guide
│
├── apps/backend/
│   ├── src/
│   │   ├── index.ts              # Server entry
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # Business logic
│   │   │   └── scraper.service.ts
│   │   ├── scrapers/             # Pool-specific
│   │   │   ├── base.ts
│   │   │   ├── pool-a-scraper.ts
│   │   │   └── factory.ts
│   │   └── jobs/                 # Background jobs
│   │       └── scraper.job.ts
│   ├── tsconfig.json
│   └── package.json
│
├── apps/frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry
│   │   ├── App.tsx               # Root component
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/                # useAvailability, etc
│   │   └── api-client.ts         # Fetch wrapper
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── package.json
│
├── packages/shared/
│   ├── src/
│   │   ├── index.ts
│   │   └── types/
│   │       ├── pool.ts
│   │       ├── booking.ts
│   │       └── api.ts
│   ├── tsconfig.json
│   └── package.json
│
└── packages/db/
    ├── src/
    │   ├── index.ts              # Database export
    │   ├── schema.ts             # Schema init
    │   ├── migrations/
    │   │   ├── index.ts
    │   │   └── sql/
    │   │       ├── 001_*.sql
    │   │       └── 002_*.sql
    │   └── queries/
    │       ├── pools.ts
    │       ├── availability.ts
    │       └── preferences.ts
    ├── tsconfig.json
    └── package.json
```

---

## Getting Started Commands

```bash
# 1. Setup workspace
pnpm install

# 2. Start all services
pnpm dev

# 3. Type checking
pnpm type-check

# 4. Build for production
pnpm build

# 5. Add dependency to backend
pnpm add -F @swim-check/backend express

# 6. Add dev dependency to frontend
pnpm add -F @swim-check/frontend -D vite
```

---

## Recommended Further Reading

- **pnpm Workspaces**: https://pnpm.io/workspaces
- **TypeScript Project References**: https://www.typescriptlang.org/docs/handbook/project-references.html
- **better-sqlite3 Guide**: https://github.com/WiseLibs/better-sqlite3/wiki
- **Vite Guide**: https://vitejs.dev/guide/
- **Express.js Best Practices**: https://expressjs.com/en/advanced/best-practice-performance.html
- **React Patterns**: https://react.dev/learn

---

## Key Takeaways

1. **Use pnpm workspaces** for simple monorepo structure
2. **Share types via @shared/types** for REST APIs
3. **Use better-sqlite3** for simplicity and speed
4. **Use React + Vite** for fast frontend development
5. **Implement scrapers as strategy pattern** for extensibility
6. **Start simple, graduate to advanced tools only when needed**

This approach is suitable for personal/small projects and can scale to medium-sized teams with minimal refactoring.

