# Engineering Decisions & Rationale

**Project**: Swim Lane Booking Checker
**Scope**: TypeScript monorepo with Express, React, SQLite, shared types
**Target**: Personal/small-scale project (1-2 developers)

---

## Decision 1: Monorepo Tool Selection

### Decision
**Use pnpm workspaces for monorepo management**

### Options Evaluated

#### Option A: pnpm Workspaces ✅ CHOSEN
**What it does**: Manages multiple related packages with shared dependencies and TypeScript path aliases.

**Pros**:
- Lightweight (no extra tool, just package manager feature)
- Fast due to content-addressable storage
- Excellent TypeScript path alias support
- Minimal configuration needed
- Easy to publish packages later if needed

**Cons**:
- Requires pnpm CLI (not npm/yarn native)
- No built-in caching optimization (can add Turborepo later)
- No built-in task orchestration (simple shell scripts sufficient)

**Cost**: Learning pnpm syntax (~1 hour)

---

#### Option B: Turborepo ❌ REJECTED
**What it does**: Advanced monorepo tool with caching, incremental builds, and task orchestration.

**Why rejected**:
- Adds complexity for a small project
- Superior build caching only matters at 10+ packages
- Configuration overhead not justified yet
- Can graduate to this if scaling up

**When to reconsider**: >10 packages, CI/CD optimization critical, 5+ developers

---

#### Option C: npm/yarn workspaces ❌ REJECTED
**What it does**: Native workspace support in npm and yarn.

**Why rejected**:
- npm workspaces are newer (2021) and less polished
- yarn is slower than pnpm
- pnpm offers better deduplication
- Switching later is trivial (identical workspace syntax)

---

#### Option D: Lerna ❌ REJECTED
**What it does**: Package management and versioning across monorepo.

**Why rejected**:
- Additional abstraction layer over npm/yarn/pnpm
- Maintenance burden
- Solves problems we don't have (multi-package versioning, publishing)
- Feels "legacy" in modern JavaScript ecosystem

---

### Implementation
```bash
pnpm install
pnpm dev  # Runs all packages
```

### Graduation Path
If scaling to 20+ packages with long builds:
```bash
pnpm add -D turbo
npx turbo run build --filter="@swim-check/backend"
```

**Decision Confidence**: 95% - This is the industry standard for small TypeScript monorepos.

---

## Decision 2: Shared Types Strategy

### Decision
**Create @shared/types package for API contracts**

### Options Evaluated

#### Option A: Shared Types Package ✅ CHOSEN
**What it does**: Single TypeScript package containing all API types imported by backend and frontend.

**Implementation**:
```typescript
// packages/shared/src/types/api.ts
export interface GetAvailabilityResponse {
  success: boolean;
  data?: AvailabilitySlot;
  error?: string;
}
```

**Usage**:
```typescript
// apps/backend/src/routes.ts
import type { GetAvailabilityResponse } from "@shared/types";
res.json(response as GetAvailabilityResponse);

// apps/frontend/src/hooks/useAvailability.ts
import type { GetAvailabilityResponse } from "@shared/types";
const data: GetAvailabilityResponse = await fetch(...).json();
```

**Pros**:
- Zero runtime cost (types erased during compilation)
- Single source of truth
- IDE refactoring support
- No build-time code generation
- Type-safe API calls without manual sync

**Cons**:
- Manual type definition (vs. auto-generated)
- Requires discipline to update types with API changes
- Not suitable if many external APIs consumed

**When this is ideal**: Internal APIs, well-defined domain model, small team

---

#### Option B: OpenAPI/Swagger Generation ❌ DEFERRED
**What it does**: Automatically generate types from API specification.

**Why deferred (not rejected)**:
- Excellent for large APIs (50+ endpoints)
- Eliminates manual type maintenance
- Useful for documentation
- Can add later without major refactoring

**Adoption trigger**: When REST API exceeds 30 endpoints or external API consumption needed

**Implementation when needed**:
```bash
pnpm add -F @swim-check/backend swagger-jsdoc
pnpm add -F @swim-check/frontend @openapi-generator-cli
```

---

#### Option C: tRPC ❌ REJECTED
**What it does**: End-to-end type-safe RPC framework replacing REST.

**Why rejected**:
- Requires backend redesign (not REST API)
- Overkill for simple pool availability queries
- WebSocket dependency (not needed yet)
- Ties frontend tightly to backend (harder to decouple)

**When to reconsider**: Real-time availability updates needed, full-stack TypeScript team

---

#### Option D: GraphQL ❌ REJECTED
**What it does**: Query language for APIs with schema-based type generation.

**Why rejected**:
- Complexity overhead for simple CRUD operations
- Significant learning curve
- Over-engineered for this use case
- REST is more cache-friendly (needed for availability data)

---

### Decision Path Map
```
┌─ Is API < 20 endpoints? YES ─→ Use Shared Types (NOW) ✓
│
├─ Will API grow to 30+? YES ─→ Plan OpenAPI migration
│
└─ Need real-time updates? YES ─→ Consider tRPC (later)
```

**Decision Confidence**: 90% - Proven pattern for internal APIs, easy to graduate to OpenAPI.

---

## Decision 3: Database Library

### Decision
**Use better-sqlite3 for synchronous, fast database access**

### Options Evaluated

#### Option A: better-sqlite3 ✅ CHOSEN
**What it does**: Synchronous Node.js bindings to SQLite.

**Example**:
```typescript
const db = new Database("pools.db");
const stmt = db.prepare("SELECT * FROM pools WHERE id = ?");
const pool = stmt.get(poolId) as Pool; // Synchronous!
```

**Pros**:
- ⚡ Fastest query execution
- 🔄 Synchronous API = simpler error handling in scrapers
- 📦 Minimal abstraction = transparent
- 🎯 Perfect for read-heavy workload (availability queries)
- 🐛 Easy debugging (direct SQL)

**Cons**:
- ❌ Synchronous = can't be used in browsers
- ❌ Blocks Node.js event loop (mitigated by connection pooling)
- ❌ No migrations built-in (we use file-based approach)

**When this is ideal**: Server-side only, simple queries, startups/small projects

**Performance**: 2-3x faster than async alternatives for simple queries

---

#### Option B: sql.js ❌ REJECTED
**What it does**: JavaScript implementation of SQLite (WASM-based).

**Why rejected**:
- Designed for browser/in-memory use
- Slower than native bindings
- File I/O less efficient
- Less suitable for server-side persistence

**When to use**: Browser-based databases, offline web apps

---

#### Option C: Drizzle-orm 🔄 DEFERRED
**What it does**: TypeScript-first ORM with lightweight abstraction.

**Why deferred (not rejected)**:
- Excellent type-safe SQL interface
- Much better than raw SQL for complex queries
- Can layer on top of better-sqlite3
- Adds ~10KB to bundle

**Adoption trigger**: When >100 queries in codebase, complex joins needed

**Implementation when ready**:
```bash
pnpm add -F @swim-check/backend drizzle-orm drizzle-kit
pnpm add -F @swim-check/backend -D @types/better-sqlite3
```

```typescript
// Later: Use Drizzle with better-sqlite3
import { drizzle } from "drizzle-orm/better-sqlite3";
const db = drizzle(new Database("pools.db"));
```

---

#### Option D: Prisma ❌ REJECTED
**What it does**: Full-featured ORM with migrations, client generation, data browser.

**Why rejected**:
- Heavy for simple project (adds ~3MB)
- Overkill for basic CRUD operations
- Schema duplication (Prisma schema + migrations)
- More opinionated (harder to customize)
- Slower query performance

**When to use**: Large enterprise projects, teams prioritizing developer experience over performance

---

#### Option E: Knex.js ❌ REJECTED
**What it does**: Query builder for multiple databases.

**Why rejected**:
- Too generic (we only use SQLite)
- Callback-heavy (older style)
- Neither simpler than better-sqlite3 nor as powerful as ORM

---

### Migration Strategy: better-sqlite3 → Drizzle-orm

**Phase 1** (now): Direct SQL via better-sqlite3
```typescript
const stmt = db.prepare("SELECT * FROM pools");
```

**Phase 2** (if needed): Gradual migration to Drizzle
```typescript
const stmt = db.select().from(pools);
```

**No breaking changes** - Both can coexist during transition

**Decision Confidence**: 95% - Perfect fit for this use case, proven by many startups.

---

## Decision 4: Frontend Framework & Bundler

### Decision
**Use React 18 with Vite (not Create React App)**

### Options Evaluated

#### Option A: React 18 + Vite ✅ CHOSEN

**Key Metrics**:
| Metric | Vite | CRA |
|--------|------|-----|
| Dev server startup | <1s | 30-50s |
| Hot reload | <100ms | 1-3s |
| Production build | 5-10s | 20-30s |
| Config complexity | Minimal | Hidden |
| Bundle size | ~50KB (gzip) | ~70KB (gzip) |

**Example vite.config.ts**:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000"  // ← Proxy backend calls
    }
  }
});
```

**Pros**:
- ⚡ Sub-second dev server startup
- 🚀 Instant hot module replacement
- 📦 Smaller bundles (ESM-native)
- 🔧 Transparent configuration (easy to customize)
- 🌍 Industry-standard (used by major companies)

**Cons**:
- ❌ Requires recent browser versions (ES2020+)
- ❌ Fewer pre-configured integrations
- ❌ Smaller community than CRA (though growing fast)

---

#### Option B: Create React App ❌ REJECTED
**What it does**: Opinionated React setup with zero configuration.

**Why rejected**:
- 🐌 Slow development experience (30-50s startup)
- 🔒 Configuration hidden (ejection required to customize)
- 📦 Larger bundles due to Webpack
- 👴 Legacy tooling (Webpack 4-5)

**Modern alternative**: Vite offers better experience without tradeoffs

---

#### Option C: Next.js ❌ REJECTED
**What it does**: React framework with server-side rendering, static generation.

**Why rejected**:
- 🎯 Overkill for this use case (read-only pool data, not e-commerce)
- 🔗 Couples frontend to Node.js backend
- 📚 Steeper learning curve
- 🚀 Unnecessary performance overhead

**When to use**: When server-side rendering, static generation, or API routes needed

---

#### Option D: Remix ❌ REJECTED
**What it does**: Full-stack React framework with server components.

**Why rejected**:
- Same concerns as Next.js
- Backend already built separately (Express.js)
- Adding complexity to architecture

---

### Decision Path
```
┌─ Need server-side rendering? NO ─┐
├─ Need static generation? NO ─────┤
├─ Want fast dev experience? YES ───┤
└─ Monorepo with separate backends? ─→ React + Vite ✓
```

**Decision Confidence**: 98% - Vite is now the standard for new React projects.

---

## Decision 5: Scraper Architecture

### Decision
**Use Strategy Pattern with Abstract Base Class and Factory**

### Options Evaluated

#### Option A: Abstract Base + Factory ✅ CHOSEN

**Architecture**:
```
BasePoolScraper (abstract)
├── PoolAScraper extends BasePoolScraper
├── PoolBScraper extends BasePoolScraper
└── PoolCScraper extends BasePoolScraper

ScraperFactory
└── createScraper(type) → BasePoolScraper instance
```

**Key files**:
- `base.ts` - Abstract class with common logic (fetching, logging, error handling)
- `pool-a-scraper.ts` - Pool-specific implementation
- `factory.ts` - Registry and instantiation

**Adding new pool** (typical workflow):
```typescript
// 1. Create scraper
class PoolDScraper extends BasePoolScraper { /* ... */ }

// 2. Register
SCRAPER_REGISTRY["pool-d"] = PoolDScraper;

// Done!
```

**Pros**:
- ✅ Easy to add new pools (5-15 minutes per pool)
- ✅ Isolated logic (each pool has own file)
- ✅ Shared infrastructure (base class = DRY)
- ✅ Single responsibility (each scraper does one thing)
- ✅ Testable (each scraper is independently testable)
- ✅ Extensible (no changes to existing scrapers when adding new ones)

**Cons**:
- ⚠️ More files than monolithic approach
- ⚠️ Requires understanding of class hierarchy

---

#### Option B: Monolithic Scraper ❌ REJECTED
**What it does**: Single function/class handling all pool scraping.

**Why rejected**:
```typescript
// ❌ BAD: All pools in one massive function
function scrapeAllPools() {
  if (poolType === "pool-a") { /* 50 lines */ }
  else if (poolType === "pool-b") { /* 50 lines */ }
  else if (poolType === "pool-c") { /* 50 lines */ }
  // ... grows to 500+ lines over time
}
```

- ⚠️ Unmaintainable as pools grow
- ⚠️ Hard to test individual pools
- ⚠️ Code duplication

---

#### Option C: Plugin System ❌ REJECTED
**What it does**: Dynamic loading of scrapers from npm packages.

**Why rejected**:
- 🎯 Over-engineered for this scale
- ❌ Adds deployment complexity
- ❌ Not needed for <10 pools
- ⏱️ Takes 5x longer to implement

**When to use**: 50+ scrapers, third-party plugin ecosystem

---

### Adding a New Pool: Step-by-Step

**Time: ~30 minutes**

```typescript
// Step 1: Create apps/backend/src/scrapers/pool-d-scraper.ts
import { BasePoolScraper } from "./base";

export class PoolDScraper extends BasePoolScraper {
  async scrape(date: string, timeSlots: string[]) {
    // 1. Fetch HTML from pool website
    const html = await this.fetch(`${this.config.url}?date=${date}`);

    // 2. Parse HTML (cheerio)
    const $ = cheerio.load(html);

    // 3. Extract lanes and availability
    const lanes = [
      { id: 1, status: "available" },
      { id: 2, status: "booked" },
      { id: 3, status: "available" }
    ];

    // 4. Return result (base class handles logging)
    return { poolId: this.config.poolId, date, slots: [{ startTime, endTime, lanes }] };
  }
}

// Step 2: Register in factory (1 line)
// In scrapers/factory.ts:
SCRAPER_REGISTRY["pool-d"] = PoolDScraper;

// Step 3: Test
// curl -X POST http://localhost:3000/api/scrape/pool-d
```

**Decision Confidence**: 99% - This is the standard design pattern for this problem.

---

## Decision 6: API Design Pattern

### Decision
**REST with JSON and shared TypeScript types**

### Options Evaluated

#### Option A: REST + JSON ✅ CHOSEN

**API Examples**:
```bash
GET  /api/pools
POST /api/availability { poolId, date, startTime, endTime }
POST /api/favorites/add { poolId }
DELETE /api/favorites/:poolId
POST /api/scrape/:poolId { date, timeSlots }
```

**Pros**:
- ✅ Simple HTTP verbs map to CRUD
- ✅ Browser-friendly (fetch API)
- ✅ Easy to cache (HTTP headers)
- ✅ Easy to debug (curl, Postman)
- ✅ Stateless by design
- ✅ Industry standard

**Cons**:
- ⚠️ Over-fetching (might need multiple endpoints)
- ⚠️ Under-fetching (might need to call multiple times)

**Mitigation**: For this project's scope, these aren't issues. REST is perfect.

---

#### Option B: GraphQL ❌ REJECTED
**What it does**: Query language for APIs with flexible data fetching.

**Why rejected**:
- 🎯 Overkill for simple availability queries
- 📈 Adds complexity (schema, resolvers, middleware)
- 🐢 Slower than REST for simple queries
- 🧠 Steeper learning curve
- 🔌 Breaks HTTP caching semantics

**When to use**: When many optional fields, multiple data sources, complex filtering

---

#### Option C: gRPC ❌ REJECTED
**What it does**: High-performance RPC framework using Protocol Buffers.

**Why rejected**:
- 🎯 Unnecessary overhead for this use case
- 🌐 Not browser-friendly (needs proxy)
- 📦 Requires binary serialization (vs. JSON)
- 🔍 Harder to debug

**When to use**: High-throughput systems, microservices, mobile apps

---

#### Option D: WebSockets ❌ DEFERRED
**What it does**: Persistent bidirectional connection for real-time updates.

**Why deferred**:
- 📊 Pool availability doesn't change in real-time
- ⏰ Polling every 5-10 minutes sufficient
- 🎯 Can add later if user demand justifies

**Adoption trigger**: When users ask for "real-time notifications"

---

### Why Not GraphQL for Pool Availability?

**REST endpoint**: 1 POST call with specific parameters
```json
POST /api/availability
{ "poolId": "pool-a", "date": "2026-02-01", "startTime": "14:00", "endTime": "15:00" }
```

**GraphQL equivalent**: More complex setup
```graphql
query {
  pool(id: "pool-a") {
    id
    name
    availability(date: "2026-02-01", startTime: "14:00") {
      lanes { id status }
    }
  }
}
```

For this use case: **REST is simpler**.

**Decision Confidence**: 97% - REST is the right tool for this job.

---

## Decision Summary Table

| Decision | Choice | Confidence | Can Change? |
|----------|--------|------------|------------|
| Monorepo | pnpm workspaces | 95% | → Turborepo (if 10+ packages) |
| Shared Types | @shared/types package | 90% | → OpenAPI (if 30+ endpoints) |
| Database | better-sqlite3 | 95% | → Drizzle-orm (if 100+ queries) |
| Frontend | React + Vite | 98% | → Next.js (if SSR needed) |
| API Design | REST + JSON | 97% | → GraphQL (if complex queries) |
| Scrapers | Strategy pattern + Factory | 99% | → Plugins (if 50+ pools) |

---

## Migration Pathways

### If API grows to 30+ endpoints:
```
Current: @shared/types
     ↓
Future: OpenAPI specification → Auto-generate types
```

### If database queries become complex:
```
Current: better-sqlite3 + raw SQL
     ↓
Future: Drizzle-orm layer on better-sqlite3
```

### If real-time updates needed:
```
Current: REST polling (5-10 min)
     ↓
Future: WebSockets with Upstash or Socket.io
```

### If scaling to 50+ scrapers:
```
Current: Strategy pattern + manual registry
     ↓
Future: Plugin system with dynamic loading
```

**All decisions can be upgraded incrementally without breaking existing code.**

---

## Next Steps

1. **Proceed with chosen tech stack** - Start implementation using QUICK_START.md
2. **Monitor decision triggers** - Watch for signs to reconsider decisions:
   - API endpoints > 30
   - Database queries > 100
   - Scrapers > 10
   - Users requesting real-time updates
3. **Review decisions quarterly** - As project evolves, revisit this document

