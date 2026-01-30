# Visual Architecture Guide

Quick visual reference for the recommended TypeScript monorepo structure for swim lane booking.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONOREPO (swim-check)                       │
│                      pnpm workspaces                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│   FRONTEND APP       │          │    BACKEND APP       │
│  (React + Vite)      │          │  (Express.js)        │
│                      │          │                      │
│ Port: 5173           │          │ Port: 3000           │
│                      │          │                      │
│ ├── Pages            │          │ ├── Routes           │
│ ├── Components       │◄─────────►├── Services          │
│ ├── Hooks            │   JSON    ├── Scrapers          │
│ └── API Client       │          │ └── Jobs             │
└──────────────────────┘          └──────────────────────┘
         ▲                                 ▲
         │                                 │
         │         ┌──────────────────┐    │
         └────────►│  @shared/types   │◄───┘
                   │  (Shared types)  │
                   └──────────────────┘
                          ▲
                          │
                   ┌──────┴──────────────────┐
                   │  @db/database           │
                   │ (SQLite + better-sqlite3)
                   │                         │
                   │ ├── Pool queries        │
                   │ ├── Availability data   │
                   │ ├── Preferences         │
                   │ └── Migrations          │
                   └─────────────────────────┘
```

---

## Data Flow: User Checks Availability

```
User opens frontend
       ↓
   [React App]
       ↓
   User selects:
   - Pool name
   - Date: 2026-02-01
   - Time slot: 14:30-15:30
       ↓
   fetch("/api/availability", {
     poolId: "pool-a",
     date: "2026-02-01",
     startTime: "14:30",
     endTime: "15:30"
   })
       ↓
   [Express Backend]
   - Receives request
   - Queries SQLite database
   - Returns availability data
       ↓
   ┌─────────────────┐
   │ SQLite Database │
   │                 │
   │ Queries table:  │
   │ lane_availability
   │ WHERE           │
   │  pool_id="pool-a"
   │  AND date="2026-02-01"
   │  AND start_time="14:30"
   └─────────────────┘
       ↓
   Backend returns JSON:
   {
     "success": true,
     "data": {
       "poolId": "pool-a",
       "date": "2026-02-01",
       "startTime": "14:30",
       "endTime": "15:30",
       "lanes": [
         { "laneId": 1, "status": "available" },
         { "laneId": 2, "status": "booked" },
         { "laneId": 3, "status": "available" }
       ],
       "availableCount": 2
     },
     "timestamp": "2026-01-30T15:27:00Z"
   }
       ↓
   Frontend displays:
   "🏊 Pool A - 2 lanes available"
   (showing lanes 1 and 3 as available)
```

---

## Type Sharing Flow

```
┌─────────────────────────────────────────────────────────────┐
│  packages/shared/src/types/api.ts                          │
│                                                              │
│  export interface GetAvailabilityRequest {                  │
│    poolId: string;                                          │
│    date: string;                                            │
│    startTime: string;                                       │
│    endTime: string;                                         │
│  }                                                           │
│                                                              │
│  export interface GetAvailabilityResponse {                 │
│    success: boolean;                                        │
│    data?: AvailabilitySlot;                                 │
│    error?: string;                                          │
│    timestamp: string;                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
        ▲                              ▲
        │                              │
        │ import type { ... }          │ import type { ... }
        │                              │
┌───────┴────────────────┐    ┌────────┴─────────────────┐
│  Backend (Express)     │    │  Frontend (React)         │
│                        │    │                           │
│ app.post("/api/...",   │    │ const response:           │
│  (req, res) => {       │    │ GetAvailabilityResponse   │
│  const req:            │    │  = await fetch(...).json()│
│  GetAvailabilityRequest
│   = req.body;          │    │                           │
│  const res:            │    │ if (response.success) {   │
│  GetAvailabilityResponse
│   = { ... };           │    │   display(response.data); │
│  res.json(res);        │    │ }                         │
│ });                    │    │                           │
└────────────────────────┘    └───────────────────────────┘

Result: Type-safe API calls with zero runtime overhead!
        IDE shows errors if types don't match ✓
        No manual synchronization needed ✓
```

---

## Adding a New Pool Scraper

```
Step 1: Analyze Pool Website
   ↓
   [Visit pool-d-booking.com]
   Find: HTML structure, CSS selectors, date format
   Time: 5-10 minutes

Step 2: Create Scraper Class
   ↓
   [apps/backend/src/scrapers/pool-d-scraper.ts]
   class PoolDScraper extends BasePoolScraper {
     async scrape(date, timeSlots) {
       // Pool-specific implementation
     }
   }
   Time: 15-20 minutes

Step 3: Register in Factory
   ↓
   [apps/backend/src/scrapers/factory.ts]
   SCRAPER_REGISTRY["pool-d"] = PoolDScraper;
   Time: 1 minute

Step 4: Test
   ↓
   curl -X POST http://localhost:3000/api/scrape/pool-d
   Time: 5 minutes

Total: ~30 minutes per pool
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────┐
│          POOLS TABLE                 │
├──────────────────────────────────────┤
│ id (PK)          │ "pool-a"          │
│ name             │ "City Pool A"     │
│ location         │ "Downtown"        │
│ lanes            │ 8                 │
│ scraper_type     │ "pool-a-scraper"  │
│ last_updated     │ 2026-01-30T...    │
└──────────────────┬───────────────────┘
                   │
                   │ 1:Many
                   ▼
┌──────────────────────────────────────┐
│     LANE_AVAILABILITY TABLE          │
├──────────────────────────────────────┤
│ id               │ 42                │
│ pool_id (FK)     │ "pool-a" ────────►│
│ lane_id          │ 1                 │
│ date             │ "2026-02-01"      │
│ start_time       │ "14:30"           │
│ end_time         │ "15:00"           │
│ status           │ "available"       │
│ last_updated     │ 2026-01-30T...    │
└──────────────────────────────────────┘

Indices for performance:
├── pool_id + date (fast by pool and date)
├── created_at (cleanup old data)
└── status (aggregate queries)
```

---

## Workspace Dependency Graph

```
@swim-check/frontend
    ├── depends on: @shared/types
    ├── depends on: react, react-dom
    └── depends on: vite, typescript

@swim-check/backend
    ├── depends on: @shared/types
    ├── depends on: @db/database
    ├── depends on: express
    ├── depends on: better-sqlite3
    ├── depends on: cheerio (HTML parsing)
    └── depends on: node-cron (scheduling)

@shared/types
    └── no external dependencies (pure types)

@db/database
    ├── depends on: @shared/types
    ├── depends on: better-sqlite3
    └── no framework dependencies
```

---

## Package Installation Pattern

```
pnpm install
    ↓
pnpm-workspace.yaml defines packages
    ↓
    ├── Installs root devDependencies
    │   └── typescript, (future: turbo)
    │
    ├── apps/backend/package.json
    │   ├── Local deps: express, better-sqlite3
    │   ├── Shared: @shared/types, @db/database
    │   └── DevDeps: @types/*, typescript, tsx
    │
    ├── apps/frontend/package.json
    │   ├── Local deps: react, react-dom
    │   ├── Shared: @shared/types
    │   └── DevDeps: vite, @vitejs/plugin-react, typescript
    │
    ├── packages/shared/package.json
    │   ├── No dependencies (just types!)
    │   └── DevDeps: typescript
    │
    └── packages/db/package.json
        ├── Shared: @shared/types
        ├── Local deps: better-sqlite3
        └── DevDeps: typescript
```

---

## API Endpoint Structure

```
GET /api/health
    ↓
    Respond: { status: "ok" }

GET /api/pools
    ↓
    Query: SELECT * FROM pools
    Respond: [{ id, name, location, lanes, ... }]

POST /api/availability
    ↓
    Body: { poolId, date, startTime, endTime }
    Query: SELECT * FROM lane_availability WHERE ...
    Respond: GetAvailabilityResponse {
      success: true,
      data: AvailabilitySlot { ... },
      timestamp: ISO
    }

POST /api/favorites/add
    ↓
    Body: { poolId }
    Action: Update user_preferences table
    Respond: { success: true }

DELETE /api/favorites/:poolId
    ↓
    Action: Remove from user_preferences
    Respond: { success: true }

POST /api/scrape/:poolId
    ↓
    Action: Run ScraperService.scrapePool()
    Respond: { success: bool, rowsUpdated: int, error?: string }
```

---

## Time Slot Selection Logic

```
User opens app at: 15:03

Default time slot calculation:
    ↓
    Current time: 15:03
    Add 30 minutes: 15:33
    Round down to nearest 30-min: 15:30 ← Start time
    Add last used duration (default 60 min): 16:30 ← End time

User sees: "Check availability for 15:30 - 16:30"
    ↓
    User can modify:
    ├── Start time: 15:30, 16:00, 16:30, 17:00, ...
    ├── Duration: 30 min, 60 min, 90 min, 120 min, ...
    └── Remember duration for next time

Stored in: user_preferences table
    ├── last_slot_duration: 90 (minutes)
    └── next time opens: proposes duration 90
```

---

## Development Workflow

```
Start Development:
    pnpm dev
    ↓
    ├─┬─ Backend (Express)
    │ ├─ Listening on http://localhost:3000
    │ └─ Auto-reloads on file changes (tsx watch)
    │
    └─┬─ Frontend (Vite)
      ├─ Listening on http://localhost:5173
      ├─ Auto-reloads on file changes (HMR)
      └─ Proxies /api to backend

Code a feature:
    ↓
    ├─ Edit types: packages/shared/src/types/api.ts
    │  ↓ (both backend and frontend see updates immediately)
    │
    ├─ Edit backend: apps/backend/src/routes.ts
    │  ↓ (backend restarts automatically)
    │
    ├─ Edit frontend: apps/frontend/src/App.tsx
    │  ↓ (frontend hot-reloads instantly)
    │
    ├─ Type check: pnpm type-check
    │  ↓ (catches errors across entire monorepo)
    │
    └─ Test manually: Browser + curl

Deploy:
    ↓
    pnpm build
    ↓
    ├─ Backend: tsc → dist/
    ├─ Frontend: tsc && vite build → dist/
    └─ Ready to deploy
```

---

## Migration Process

```
Database starts fresh (no tables)
    ↓
Call: initializeDatabase()
    ↓
    ├─ Read: packages/db/src/migrations/sql/
    │
    ├─ Check: CREATE TABLE migrations (tracks completed)
    │
    ├─ For each SQL file in order:
    │  ├─ 001_initial_schema.sql
    │  │  └─ Creates pools, lane_availability, user_preferences tables
    │  │
    │  ├─ 002_add_scraper_logs.sql
    │  │  └─ Creates scraper_logs table for monitoring
    │  │
    │  └─ 003_add_indices.sql
    │     └─ Adds performance indices
    │
    ├─ Log each migration:
    │  ✓ Executed migration 001_initial_schema.sql
    │  ✓ Executed migration 002_add_scraper_logs.sql
    │  ✓ Executed migration 003_add_indices.sql
    │
    └─ Next startup:
       Skips completed migrations
       Runs only new ones

Result: Version-controlled schema changes
        Reproducible across environments ✓
        No manual SQL commands needed ✓
```

---

## Error Handling: Scraper Example

```
ScraperService.scrapePool(poolId, date, timeSlots)
    ↓
    Try:
    ├─ Validate inputs
    ├─ Get pool from database
    ├─ Create scraper instance (factory)
    ├─ Call scraper.scrape()
    │  ↓
    │  Scraper tries:
    │  ├─ Fetch pool website (with timeout)
    │  ├─ Parse HTML
    │  ├─ Extract lanes
    │  ├─ Log execution (success/fail/partial)
    │  └─ Return result
    │
    └─ Update database with results

    Catch error:
    ├─ Log error to database (scraper_logs table)
    │  └── { pool_id, status: "failed", error_message, created_at }
    ├─ Return to client:
    │  └── { success: false, error: "description" }
    └─ Alert operator:
       └── (Future: Sentry, email, Slack)

Result:
  ├─ User sees: "Unable to fetch pool availability, try again later"
  ├─ Developer sees: Error logged with timestamp
  └─ Automatic retries: Try again next scheduled run
```

---

## Technology Stack Layers

```
Layer 1: Framework
├── Frontend: React 18
└── Backend: Express.js

Layer 2: Language & Types
├── TypeScript 5.3+
├── Shared types: @shared/types
└── Type checking: tsc

Layer 3: Data
├── Database: SQLite (file-based)
├── Client: better-sqlite3
├── Queries: Custom query helpers
└── Migrations: File-based SQL

Layer 4: Build & Dev Tools
├── Bundler: Vite
├── Package manager: pnpm
├── Monorepo: pnpm workspaces
└── Scripting: Node.js + tsx

Layer 5: API & Communication
├── Protocol: HTTP/REST
├── Format: JSON
├── Proxy: Vite dev server
└── Status: HTTP status codes

Layer 6: Deployment
├── Backend: Node.js + Express
├── Frontend: Static files + CDN
├── Database: SQLite file on disk
└── Optional: Docker, Vercel, Railway
```

---

## Scaling Roadmap

```
Current (Personal project)
├── pnpm workspaces
├── REST + JSON
├── SQLite + better-sqlite3
├── React + Vite
├── Express.js
└── 3-5 pool scrapers

↓ If 10+ packages needed
├── Add: Turborepo (caching)
└── Keep: Everything else

↓ If 30+ API endpoints
├── Add: OpenAPI + code generation
└── Keep: REST structure

↓ If 100+ queries
├── Add: Drizzle-orm layer
└── Keep: better-sqlite3 underneath

↓ If PostgreSQL needed
├── Switch: better-sqlite3 → drizzle-orm + postgres
└── Keep: Everything else

↓ If real-time needed
├── Add: WebSockets (Socket.io)
├── Add: Redis (for pub/sub)
└── Keep: REST for normal operations

↓ If 50+ pool scrapers
├── Add: Plugin system
├── Add: Dynamic scraper loading
└── Keep: Strategy pattern base
```

---

## One-Page Summary

```
SWIM CHECK - SYSTEM ARCHITECTURE
════════════════════════════════════════════════════════════════

Frontend (React 18 + Vite @ 5173)
  ├─ User selects pool + date + time
  └─ Calls /api/availability

Type Safety (@shared/types)
  ├─ Shared interfaces: GetAvailabilityRequest, GetAvailabilityResponse
  └─ Used by both frontend & backend

Backend (Express.js @ 3000)
  ├─ Receives request
  ├─ Queries database
  ├─ Returns availability data
  ├─ Runs pool scrapers (scheduled + on-demand)
  └─ Manages favorites & preferences

Database (SQLite @ swim-check.db)
  ├─ pools: Pool information
  ├─ lane_availability: Booking status per lane/time
  ├─ user_preferences: Favorites & settings
  └─ scraper_logs: Error tracking & monitoring

Scrapers (Strategy Pattern)
  ├─ BasePoolScraper (abstract)
  ├─ PoolAScraper extends BasePoolScraper
  ├─ PoolBScraper extends BasePoolScraper
  └─ Factory for instantiation

Monorepo (pnpm workspaces)
  ├── apps/backend
  ├── apps/frontend
  ├── packages/shared (types)
  ├── packages/db (database)
  └── All packages share types

Deployment
  ├─ Backend: Node.js + Express (Railway/Heroku)
  ├─ Frontend: Static files (Vercel/Netlify)
  ├─ Database: SQLite on backend server
  └─ Scrapers: Cron jobs on backend

Key Principles:
  ✓ Simple over complex
  ✓ Type-safe across stack
  ✓ Easy to add new pools
  ✓ Scalable architecture
  ✓ Zero runtime overhead for types
```

