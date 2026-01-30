# Quickstart: Swim Lane Booking Checker

**Feature Branch**: `001-swim-lane-booking`
**Date**: 2026-01-30

## Prerequisites

- Node.js 20 LTS or later
- pnpm 8.x or later (`npm install -g pnpm`)
- Git

## Project Setup

### 1. Initialize Monorepo

```bash
# From repository root
pnpm init

# Create workspace configuration
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF
```

### 2. Create Package Structure

```bash
mkdir -p packages/shared/src/types
mkdir -p packages/backend/src/{api,db,scrapers,services}
mkdir -p packages/frontend/src/{components,pages,services}
```

### 3. Initialize Packages

**Shared Types Package** (`packages/shared/package.json`):
```json
{
  "name": "@swim-check/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

**Backend Package** (`packages/backend/package.json`):
```json
{
  "name": "@swim-check/backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@swim-check/shared": "workspace:*"
  }
}
```

**Frontend Package** (`packages/frontend/package.json`):
```json
{
  "name": "@swim-check/frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "@swim-check/shared": "workspace:*"
  }
}
```

### 4. Install Dependencies

```bash
# From repository root
pnpm add -D typescript @types/node vitest -w

# Backend dependencies
pnpm add express better-sqlite3 cheerio uuid -F @swim-check/backend
pnpm add -D @types/express @types/better-sqlite3 @types/uuid tsx -F @swim-check/backend

# Frontend dependencies
pnpm add react react-dom -F @swim-check/frontend
pnpm add -D @types/react @types/react-dom @vitejs/plugin-react vite -F @swim-check/frontend

# Install all
pnpm install
```

### 5. TypeScript Configuration

**Root** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist"
  }
}
```

**Backend** (`packages/backend/tsconfig.json`):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

## Quick Implementation Guide

### 1. Define Shared Types

```typescript
// packages/shared/src/types/models.ts
export interface SwimmingPool {
  id: string;
  name: string;
  location: string;
  websiteUrl: string;
  totalLanes: number;
}

export interface TimeSlot {
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
}

export interface LaneAvailability {
  laneId: string;
  laneNumber: number;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface PoolAvailability {
  pool: SwimmingPool;
  date: string;
  timeSlot: TimeSlot;
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
}
```

### 2. Create Scraper Interface

```typescript
// packages/backend/src/scrapers/types.ts
import { TimeSlot, LaneAvailability } from '@swim-check/shared';

export interface PoolScraper {
  poolId: string;
  name: string;

  fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]>;
  isHealthy(): Promise<boolean>;
}
```

### 3. Set Up Database

```typescript
// packages/backend/src/db/schema.ts
import Database from 'better-sqlite3';

export function initializeDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS swimming_pools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      website_url TEXT NOT NULL,
      total_lanes INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_entries (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  return db;
}
```

### 4. Create Express API

```typescript
// packages/backend/src/api/routes.ts
import { Router } from 'express';

export function createRouter(): Router {
  const router = Router();

  router.get('/pools', (req, res) => {
    // List pools
  });

  router.get('/pools/:poolId/availability', (req, res) => {
    // Get availability
  });

  router.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
```

### 5. Start Backend

```typescript
// packages/backend/src/index.ts
import express from 'express';
import { createRouter } from './api/routes.js';

const app = express();
app.use(express.json());
app.use('/api/v1', createRouter());

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Development Workflow

### Running in Development

```bash
# Terminal 1: Shared types (watch mode)
pnpm -F @swim-check/shared dev

# Terminal 2: Backend
pnpm -F @swim-check/backend dev

# Terminal 3: Frontend
pnpm -F @swim-check/frontend dev
```

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm -F @swim-check/backend test
```

### Building for Production

```bash
pnpm build
```

## File Structure After Setup

```
swim-check/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── types/
│   │           └── models.ts
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── swim-check.db          # SQLite database
│   │   └── src/
│   │       ├── index.ts           # Entry point
│   │       ├── api/
│   │       │   └── routes.ts
│   │       ├── db/
│   │       │   └── schema.ts
│   │       ├── scrapers/
│   │       │   ├── types.ts       # PoolScraper interface
│   │       │   ├── registry.ts    # ScraperRegistry
│   │       │   └── pools/         # Individual pool scrapers
│   │       └── services/
│   │           └── availability.ts
│   └── frontend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── components/
│           ├── pages/
│           └── services/
│               └── api.ts         # API client
└── specs/
    └── 001-swim-lane-booking/
        └── [spec files]
```

## Next Steps

1. **Run `/speckit.tasks`** to generate the implementation task list
2. Implement scraper for first target pool
3. Build out API endpoints following the OpenAPI contract
4. Create React components for availability display

## Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | pnpm workspaces | Simple, fast, native TypeScript |
| Backend | Express.js | Lightweight, familiar, large ecosystem |
| Database | SQLite + better-sqlite3 | Simple, no setup, sufficient for scale |
| Frontend | React + Vite | Fast dev loop, component model fits UI |
| Scraping | Cheerio-first | Fast, lightweight, upgrade to Puppeteer if needed |
| Shared Types | @swim-check/shared package | Type safety, single source of truth |
