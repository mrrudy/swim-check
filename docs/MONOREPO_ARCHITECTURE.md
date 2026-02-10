# TypeScript Monorepo Architecture Guide
## Swim Lane Booking Application

**Created**: 2026-01-30
**Scope**: Full-stack TypeScript monorepo with Express.js backend, React frontend, SQLite database, and shared types

---

## 1. Project Structure & Monorepo Strategy

### Recommended Approach: **Simple pnpm Workspaces** (Preferred for small-scale projects)

For a personal/small-scale project like swim lane booking, **pnpm workspaces** offer the best balance of simplicity and power without introducing unnecessary complexity.

#### Why pnpm workspaces over alternatives:

| Tool | Pros | Cons | Best For |
|------|------|------|----------|
| **pnpm workspaces** | Lightweight, fast, native monorepo support, disk-efficient | Requires pnpm CLI | Small to medium teams, disk-constrained environments |
| **Turborepo** | Excellent caching, incremental builds, optimized CI/CD | Adds complexity, overkill for simple projects | Large projects with many packages, CI/CD optimization |
| **npm/yarn workspaces** | Native support, widely known | No deduplication (npm), slower (yarn) | Teams already using these tools |
| **Lerna** | Popular, works with any package manager | Maintenance burden, adds abstraction layer | Legacy projects |

**Decision**: Use **pnpm workspaces** + **Turborepo light configuration** for optional future scaling.

---

### Directory Structure (Recommended)

```
swim-check/
├── pnpm-workspace.yaml              # Workspace root config
├── package.json                      # Root package (non-publishable)
├── turbo.json                        # Optional: future caching/task orchestration
├── tsconfig.json                     # Root TypeScript config (extended by packages)
│
├── apps/
│   ├── backend/                      # Express.js API server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── scrapers/             # Pool scrapers (modular)
│   │   │   ├── db/
│   │   │   │   ├── migrations/
│   │   │   │   └── schema.ts         # Database schema definitions
│   │   │   └── middleware/
│   │   └── package.json
│   │
│   └── frontend/                     # React application
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── api-client.ts         # Generated or shared
│       └── vite.config.ts            # Vite (faster than CRA)
│
├── packages/
│   ├── shared/                       # Shared types and utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── pool.ts           # Pool-related types
│   │   │   │   ├── booking.ts        # Booking-related types
│   │   │   │   └── api.ts            # API request/response types
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── db/                           # Database layer (optional shared)
│       ├── package.json
│       ├── src/
│       │   ├── schema.ts             # Database schema
│       │   ├── migrations/
│       │   └── queries.ts
│       └── package.json
│
├── .github/workflows/                # CI/CD (optional)
├── docs/                             # Architecture docs
└── README.md
```

#### Why this structure:

- **`apps/`**: Production applications (backend, frontend)
- **`packages/`**: Shared, reusable libraries
- **Minimal nesting**: Reduces complexity, easier navigation
- **Clear boundaries**: Each package has explicit dependencies
- **Scalable**: Easy to add new packages without restructuring

---

## 2. TypeScript Configuration

### Root `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/shared/src/*"],
      "@db/*": ["packages/db/src/*"]
    }
  },
  "include": ["packages/*/src", "apps/*/src"],
  "exclude": ["**/node_modules", "**/.next", "**/dist"]
}
```

### Package-level `tsconfig.json` examples:

**Backend** (`apps/backend/tsconfig.json`):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Frontend** (`apps/frontend/tsconfig.json`):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*", "vite-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Shared** (`packages/shared/tsconfig.json`):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 3. Shared Types Pattern

### Rationale

Sharing types between frontend and backend eliminates duplication and ensures API contract consistency. This is critical for a REST API-based application.

### Implementation Strategy: **Type Definition Package**

```typescript
// packages/shared/src/types/api.ts
export interface PoolInfo {
  id: string;
  name: string;
  location: string;
  address: string;
  lanes: number;
  operatingHours: {
    open: string;    // "07:00"
    close: string;   // "22:00"
  };
  lastUpdated: string; // ISO timestamp
}

export interface LaneAvailability {
  laneId: number;
  status: "available" | "booked" | "maintenance";
  lastUpdated: string;
}

export interface AvailabilitySlot {
  poolId: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  lanes: LaneAvailability[];
  availableCount: number;
}

export interface TimeSlot {
  startTime: string;   // HH:mm
  duration: number;    // minutes (30, 60, 90, etc.)
}

export interface UserPreferences {
  favoritePools: string[];
  lastSlotDuration: number; // minutes
  lastSearchDate: string;
}

// API Request/Response types
export interface GetAvailabilityRequest {
  poolId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface GetAvailabilityResponse {
  success: boolean;
  data?: AvailabilitySlot;
  error?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}
```

**Usage in Backend**:
```typescript
// apps/backend/src/routes/availability.ts
import type { GetAvailabilityRequest, GetAvailabilityResponse } from "@shared/types";

app.post("/api/availability", async (req, res) => {
  const request: GetAvailabilityRequest = req.body;
  // ... fetch data
  const response: GetAvailabilityResponse = { success: true, data: {...} };
  res.json(response);
});
```

**Usage in Frontend**:
```typescript
// apps/frontend/src/api-client.ts
import type { GetAvailabilityRequest, GetAvailabilityResponse } from "@shared/types";

export async function fetchAvailability(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
  const response = await fetch("/api/availability", {
    method: "POST",
    body: JSON.stringify(request),
    headers: { "Content-Type": "application/json" }
  });
  return response.json() as Promise<GetAvailabilityResponse>;
}
```

**Benefits**:
- Single source of truth for API contracts
- Type safety across the entire stack
- Automatic refactoring via IDE support
- Zero runtime overhead (types are stripped during compilation)

### Alternative: API Client Generation

For larger projects, consider **OpenAPI/GraphQL code generation**:

| Tool | Pros | Cons | When to use |
|------|------|------|------------|
| **OpenAPI Generator** | Industry standard, generates from schema | Adds build step, extra dependency | Complex APIs, multiple clients |
| **tRPC** | Full type safety, minimal overhead | Requires backend changes, less standard | Internal APIs, real-time needs |
| **GraphQL Codegen** | Powerful, handles subscriptions | Overkill for simple REST APIs | Complex data querying needs |

**Recommendation for your project**: Start with the **shared types package** (simpler, zero configuration). Graduate to OpenAPI only if API complexity justifies it.

---

## 4. SQLite Database Strategy

### Library Choice: **better-sqlite3** (Recommended)

| Library | Sync/Async | Pros | Cons | Best For |
|---------|-----------|------|------|----------|
| **better-sqlite3** | Sync | Fastest, simple API, no callbacks | No async, larger builds | Small-medium projects, simple queries |
| **sql.js** | Sync | Runs in-memory or WASM | Limited file I/O, browser-focused | Learning, in-memory databases |
| **drizzle-orm** | Both | Type-safe, great DX, lightweight | Newer, smaller community | Type-safe SQL, modern projects |
| **prisma** | Async | Excellent DX, migrations built-in | Heavier, more magical | Large enterprise projects |
| **knex.js** | Async | Lightweight, query builder | Callback-heavy, older style | Legacy projects, simple queries |

**Decision**: **better-sqlite3** for initial development (simplicity + speed), with optional **drizzle-orm** layer for type safety.

### Database Setup (better-sqlite3)

```typescript
// packages/db/src/database.ts
import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(__dirname, "swim-check.db");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Export for migrations
export function getDb() {
  return db;
}
```

### Schema Definition

```typescript
// packages/db/src/schema.ts
import type { Database } from "better-sqlite3";

export function initializeDatabase(db: Database.Database) {
  // Pools table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      address TEXT,
      lanes INTEGER NOT NULL,
      operating_hours_open TEXT NOT NULL DEFAULT '07:00',
      operating_hours_close TEXT NOT NULL DEFAULT '22:00',
      scraper_type TEXT NOT NULL,
      last_updated TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lane availability table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lane_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      lane_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unknown',
      last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
      UNIQUE(pool_id, lane_id, date, start_time)
    )
  `);

  // User preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      favorite_pools TEXT NOT NULL DEFAULT '[]',
      last_slot_duration INTEGER NOT NULL DEFAULT 60,
      last_search_date TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scraper logs (for monitoring and debugging)
  db.exec(`
    CREATE TABLE IF NOT EXISTS scraper_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      scraper_type TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      rows_updated INTEGER,
      execution_time_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
    )
  `);

  // Create indices for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_lane_availability_pool_date
      ON lane_availability(pool_id, date);
    CREATE INDEX IF NOT EXISTS idx_lane_availability_created
      ON lane_availability(created_at);
    CREATE INDEX IF NOT EXISTS idx_scraper_logs_pool
      ON scraper_logs(pool_id);
  `);
}
```

### Migration System (Simple File-Based)

```typescript
// packages/db/src/migrations/index.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

interface MigrationRecord {
  version: number;
  name: string;
  executed_at: string;
}

export function runMigrations(db: Database.Database) {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      executed_at TEXT NOT NULL
    )
  `);

  const migrationsDir = path.join(__dirname, "sql");
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  const executedMigrations = db.prepare(
    "SELECT version FROM migrations"
  ).all() as MigrationRecord[];

  const executedVersions = new Set(executedMigrations.map(m => m.version));

  for (const file of files) {
    const version = parseInt(file.split("_")[0], 10);

    if (executedVersions.has(version)) {
      console.log(`✓ Migration ${file} already executed`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

    try {
      db.exec(sql);
      db.prepare(
        "INSERT INTO migrations (version, name, executed_at) VALUES (?, ?, ?)"
      ).run(version, file, new Date().toISOString());

      console.log(`✓ Executed migration ${file}`);
    } catch (error) {
      console.error(`✗ Failed to execute migration ${file}:`, error);
      throw error;
    }
  }
}
```

Example migration file structure:
```
packages/db/src/migrations/sql/
├── 001_initial_schema.sql
├── 002_add_scraper_logs.sql
└── 003_add_indices.sql
```

### Query Helpers

```typescript
// packages/db/src/queries.ts
import type { Database } from "better-sqlite3";
import type { PoolInfo, AvailabilitySlot } from "@shared/types";

export class PoolQueries {
  constructor(private db: Database.Database) {}

  getPoolById(poolId: string): PoolInfo | null {
    const row = this.db.prepare(`
      SELECT * FROM pools WHERE id = ?
    `).get(poolId) as any;

    return row ? this.mapPoolRow(row) : null;
  }

  getAllPools(): PoolInfo[] {
    const rows = this.db.prepare("SELECT * FROM pools ORDER BY name").all() as any[];
    return rows.map(row => this.mapPoolRow(row));
  }

  private mapPoolRow(row: any): PoolInfo {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      address: row.address,
      lanes: row.lanes,
      operatingHours: {
        open: row.operating_hours_open,
        close: row.operating_hours_close
      },
      lastUpdated: row.last_updated
    };
  }
}

export class AvailabilityQueries {
  constructor(private db: Database.Database) {}

  getAvailability(poolId: string, date: string, startTime: string, endTime: string): AvailabilitySlot | null {
    const rows = this.db.prepare(`
      SELECT * FROM lane_availability
      WHERE pool_id = ? AND date = ? AND start_time = ? AND end_time = ?
      ORDER BY lane_id
    `).all(poolId, date, startTime, endTime) as any[];

    if (!rows.length) return null;

    const availableCount = rows.filter(r => r.status === "available").length;

    return {
      poolId,
      date,
      startTime,
      endTime,
      lanes: rows.map(r => ({
        laneId: r.lane_id,
        status: r.status,
        lastUpdated: r.last_updated
      })),
      availableCount
    };
  }

  updateAvailability(poolId: string, date: string, startTime: string, endTime: string, lanes: any[]) {
    const stmt = this.db.prepare(`
      INSERT INTO lane_availability (pool_id, lane_id, date, start_time, end_time, status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(pool_id, lane_id, date, start_time) DO UPDATE SET
        status = excluded.status,
        last_updated = excluded.last_updated
    `);

    const insert = this.db.transaction((data: typeof lanes) => {
      for (const lane of data) {
        stmt.run(poolId, lane.id, date, startTime, endTime, lane.status, new Date().toISOString());
      }
    });

    insert(lanes);
  }
}
```

---

## 5. Backend API Structure

### Express Setup with Shared Types

```typescript
// apps/backend/src/index.ts
import express from "express";
import { db } from "@db/database";
import { PoolQueries, AvailabilityQueries } from "@db/queries";
import type { GetAvailabilityRequest, GetAvailabilityResponse } from "@shared/types";

const app = express();
app.use(express.json());

const poolQueries = new PoolQueries(db);
const availabilityQueries = new AvailabilityQueries(db);

// List all pools
app.get("/api/pools", (req, res) => {
  const pools = poolQueries.getAllPools();
  res.json({ success: true, data: pools });
});

// Get availability
app.post("/api/availability", (req, res) => {
  try {
    const request: GetAvailabilityRequest = req.body;
    const availability = availabilityQueries.getAvailability(
      request.poolId,
      request.date,
      request.startTime,
      request.endTime
    );

    const response: GetAvailabilityResponse = {
      success: !!availability,
      data: availability || undefined,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    const response: GetAvailabilityResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Modular Scraper Architecture

```typescript
// apps/backend/src/scrapers/base.ts
import type { Database } from "better-sqlite3";

export interface ScraperResult {
  poolId: string;
  date: string;
  startTime: string;
  endTime: string;
  lanes: { id: number; status: "available" | "booked" | "maintenance" }[];
}

export abstract class BasePoolScraper {
  constructor(protected poolId: string, protected db: Database.Database) {}

  abstract scrape(date: string, startTime: string, endTime: string): Promise<ScraperResult>;

  protected logScraperExecution(status: string, error?: string, rowsUpdated?: number) {
    this.db.prepare(`
      INSERT INTO scraper_logs (pool_id, scraper_type, status, error_message, rows_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(this.poolId, this.constructor.name, status, error, rowsUpdated, new Date().toISOString());
  }
}

// apps/backend/src/scrapers/pool-a-scraper.ts
import { BasePoolScraper } from "./base";

export class PoolAScraper extends BasePoolScraper {
  async scrape(date: string, startTime: string, endTime: string) {
    try {
      // Implement specific pool's scraping logic
      const result = {
        poolId: this.poolId,
        date,
        startTime,
        endTime,
        lanes: [
          { id: 1, status: "available" as const },
          { id: 2, status: "booked" as const },
          { id: 3, status: "available" as const }
        ]
      };

      this.logScraperExecution("success", undefined, result.lanes.length);
      return result;
    } catch (error) {
      this.logScraperExecution("failed", error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }
}
```

---

## 6. Frontend Setup with Vite

### Why Vite over Create React App:

| Feature | Vite | Create React App |
|---------|------|------------------|
| Build time | <1s | 30-50s |
| Dev server | Instant | Slow refresh |
| Config | Minimal | Hidden/ejected |
| Bundle size | Smaller | Larger |
| Tree-shaking | Excellent | Good |

### Vite Config

```typescript
// apps/frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared/src")
    }
  }
});
```

### API Client with Type Safety

```typescript
// apps/frontend/src/hooks/useAvailability.ts
import { useState } from "react";
import type { GetAvailabilityRequest, GetAvailabilityResponse } from "@shared/types";

export function useAvailability() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async (request: GetAvailabilityRequest): Promise<GetAvailabilityResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: GetAvailabilityResponse = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to fetch availability");
        return null;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAvailability, loading, error };
}
```

---

## 7. Package Configuration

### Root `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json`

```json
{
  "name": "swim-check",
  "version": "0.1.0",
  "private": true,
  "description": "Swimming lane availability checker",
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "start:backend": "cd apps/backend && pnpm start",
    "start:frontend": "cd apps/frontend && pnpm start",
    "lint": "pnpm -r run lint",
    "type-check": "pnpm -r run type-check"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "turbo": "^1.10.0"
  }
}
```

### Backend `package.json`

```json
{
  "name": "@swim-check/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/types": "workspace:*",
    "@db/database": "workspace:*",
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

### Frontend `package.json`

```json
{
  "name": "@swim-check/frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/types": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.7"
  }
}
```

### Shared Types `package.json`

```json
{
  "name": "@shared/types",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

---

## 8. Development Workflow

### Initial Setup

```bash
# Install pnpm if needed
npm install -g pnpm

# Clone and install
git clone <repo>
cd swim-check
pnpm install

# Start development
pnpm dev  # Runs backend and frontend in parallel
```

### Adding Dependencies

```bash
# Add to backend
pnpm add -F @swim-check/backend express

# Add to frontend
pnpm add -F @swim-check/frontend react

# Add to shared types (installed by both)
pnpm add -F @shared/types typescript
```

### Type Checking

```bash
# Check all packages
pnpm type-check

# Or per-package
cd apps/backend && pnpm type-check
```

---

## 9. Decision Summary Table

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monorepo Tool** | pnpm workspaces | Lightweight, fast, disk-efficient for small projects |
| **Frontend Framework** | React 18 with Vite | Fast dev server, smaller bundle, modern tooling |
| **Database** | better-sqlite3 | Synchronous API, fastest for simple queries, no async overhead |
| **Shared Types** | Type package (@shared/types) | Zero runtime cost, single source of truth, IDE support |
| **API Pattern** | REST with shared types | Simple, type-safe, no additional tooling needed |
| **Scraper Architecture** | Abstract base class + implementations | Modular, extensible, easy to add new pools |
| **Migrations** | File-based SQL with version tracking | Simple, transparent, no ORM magic |
| **Build Tool** | TypeScript compiler + Vite | Native, fast, minimal configuration |

---

## 10. Advanced Topics (For Future Scaling)

### When to Consider Advanced Solutions:

#### Turborepo for CI/CD
When your monorepo grows to 10+ packages with long build times:
```bash
pnpm add -D turbo
npx turbo run build --filter="@swim-check/backend"
```

#### API Code Generation (OpenAPI)
When REST API becomes complex (50+ endpoints):
```bash
pnpm add -F @swim-check/frontend @openapi-generator-cli
```

#### ORM Integration (Drizzle)
If you need complex queries or type-safe SQL:
```bash
pnpm add -F @swim-check/backend drizzle-orm drizzle-kit
```

#### Real-time Updates (WebSockets)
If availability data needs real-time push:
```bash
pnpm add -F @swim-check/backend socket.io
pnpm add -F @swim-check/frontend socket.io-client
```

---

## 11. File Templates

### New Scraper Template

```typescript
// apps/backend/src/scrapers/new-pool-scraper.ts
import { BasePoolScraper, type ScraperResult } from "./base";

/**
 * Scraper for [Pool Name]
 * Website: [URL]
 * Scraping strategy: [How it works]
 */
export class NewPoolScraper extends BasePoolScraper {
  async scrape(date: string, startTime: string, endTime: string): Promise<ScraperResult> {
    // TODO: Implement scraping logic
    throw new Error("Not implemented");
  }
}
```

---

## References & Resources

- **pnpm Workspaces**: https://pnpm.io/workspaces
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3
- **Vite**: https://vitejs.dev
- **Express.js**: https://expressjs.com
- **React Best Practices**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs

