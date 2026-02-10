# Database & Scraper Architecture Guide

---

## Part 1: SQLite Implementation with better-sqlite3

### Why better-sqlite3?

**Comparison with alternatives:**

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Feature         │ better-sqlite3   │ sql.js           │ drizzle-orm      │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Speed           │ ⭐⭐⭐⭐⭐ (fastest) │ ⭐⭐⭐ (medium)   │ ⭐⭐⭐⭐ (fast)   │
│ API Style       │ Sync (simple)    │ Sync             │ Type-safe ORM    │
│ Learning curve  │ Easy             │ Medium           │ Steep            │
│ Overhead        │ None             │ None             │ Thin             │
│ Best for        │ Simple projects  │ Embedded/browser │ Large projects   │
│ File size       │ 1.8 MB           │ 800 KB           │ varies           │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

For a personal swim lane project, **better-sqlite3 wins** because:
- No async complexity (simpler error handling)
- Synchronous API = simpler scraper implementation
- Fastest query execution
- Direct SQL control (easier debugging)

### Setup better-sqlite3

```bash
pnpm add -F @swim-check/backend better-sqlite3
pnpm add -F @swim-check/backend -D @types/better-sqlite3
```

### Database Module Structure

```
packages/db/
├── src/
│   ├── index.ts              # Main database export
│   ├── schema.ts             # Schema initialization
│   ├── migrations/
│   │   ├── index.ts
│   │   └── sql/
│   │       ├── 001_initial_schema.sql
│   │       └── 002_add_indices.sql
│   └── queries/              # Query helpers
│       ├── pools.ts
│       ├── availability.ts
│       └── preferences.ts
└── package.json
```

### Implementation: Database Module

**`packages/db/src/index.ts`** - Main database setup:
```typescript
import Database from "better-sqlite3";
import path from "path";
import { initializeSchema } from "./schema";
import { runMigrations } from "./migrations";

// Determine database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "swim-check.db");

// Create or open database
export const db = new Database(DB_PATH);

// Enable foreign keys for referential integrity
db.pragma("foreign_keys = ON");

// Optimize for concurrent read-heavy workload (scrapers)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// Initialize schema and run migrations on startup
export function initializeDatabase() {
  try {
    initializeSchema(db);
    runMigrations(db);
    console.log(`✓ Database initialized at ${DB_PATH}`);
  } catch (error) {
    console.error("✗ Failed to initialize database:", error);
    throw error;
  }
}

export type { Database } from "better-sqlite3";
```

**`packages/db/src/schema.ts`** - Define schema:
```typescript
import type Database from "better-sqlite3";

export function initializeSchema(db: Database.Database) {
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
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lane_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      lane_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'maintenance', 'unknown')),
      last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE,
      UNIQUE(pool_id, lane_id, date, start_time)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      favorite_pools TEXT NOT NULL DEFAULT '[]',
      last_slot_duration INTEGER NOT NULL DEFAULT 60,
      last_search_date TEXT,
      last_search_pool_id TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scraper_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pool_id TEXT NOT NULL,
      scraper_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
      error_message TEXT,
      rows_updated INTEGER,
      execution_time_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lane_availability_pool_date
      ON lane_availability(pool_id, date);

    CREATE INDEX IF NOT EXISTS idx_lane_availability_time
      ON lane_availability(date, start_time);

    CREATE INDEX IF NOT EXISTS idx_scraper_logs_pool
      ON scraper_logs(pool_id, created_at);

    INSERT OR IGNORE INTO user_preferences (id) VALUES (1);
  `);
}
```

**`packages/db/src/queries/pools.ts`** - Pool queries:
```typescript
import type { Database } from "better-sqlite3";
import type { PoolInfo } from "@shared/types";

export class PoolQueries {
  private getStmt: Database.Statement;
  private getAllStmt: Database.Statement;
  private insertStmt: Database.Statement;
  private updateLastUpdatedStmt: Database.Statement;

  constructor(private db: Database.Database) {
    this.getStmt = db.prepare("SELECT * FROM pools WHERE id = ?");
    this.getAllStmt = db.prepare("SELECT * FROM pools ORDER BY name");
    this.insertStmt = db.prepare(`
      INSERT OR REPLACE INTO pools (id, name, location, address, lanes, scraper_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    this.updateLastUpdatedStmt = db.prepare(`
      UPDATE pools SET last_updated = ?, updated_at = ? WHERE id = ?
    `);
  }

  getPoolById(poolId: string): PoolInfo | null {
    const row = this.getStmt.get(poolId) as any;
    return row ? this.mapToPoolInfo(row) : null;
  }

  getAllPools(): PoolInfo[] {
    const rows = this.getAllStmt.all() as any[];
    return rows.map(row => this.mapToPoolInfo(row));
  }

  searchPools(query: string): PoolInfo[] {
    const searchStmt = this.db.prepare(`
      SELECT * FROM pools
      WHERE name LIKE ? OR location LIKE ? OR address LIKE ?
      ORDER BY name
    `);
    const searchTerm = `%${query}%`;
    const rows = searchStmt.all(searchTerm, searchTerm, searchTerm) as any[];
    return rows.map(row => this.mapToPoolInfo(row));
  }

  createPool(id: string, name: string, location: string, address: string, lanes: number, scraperType: string): PoolInfo {
    this.insertStmt.run(id, name, location, address, lanes, scraperType);
    const now = new Date().toISOString();
    this.updateLastUpdatedStmt.run(now, now, id);
    return this.getPoolById(id)!;
  }

  private mapToPoolInfo(row: any): PoolInfo {
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
```

**`packages/db/src/queries/availability.ts`** - Availability queries:
```typescript
import type { Database } from "better-sqlite3";
import type { AvailabilitySlot, LaneAvailability } from "@shared/types";

export class AvailabilityQueries {
  private getStmt: Database.Statement;
  private insertStmt: Database.Statement;
  private deleteOldStmt: Database.Statement;

  constructor(private db: Database.Database) {
    this.getStmt = this.db.prepare(`
      SELECT * FROM lane_availability
      WHERE pool_id = ? AND date = ? AND start_time = ? AND end_time = ?
      ORDER BY lane_id
    `);

    this.insertStmt = this.db.prepare(`
      INSERT INTO lane_availability (pool_id, lane_id, date, start_time, end_time, status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(pool_id, lane_id, date, start_time) DO UPDATE SET
        status = excluded.status,
        last_updated = excluded.last_updated
    `);

    // Clean up old availability data (older than 7 days)
    this.deleteOldStmt = this.db.prepare(`
      DELETE FROM lane_availability
      WHERE date < date('now', '-7 days')
    `);
  }

  getAvailability(
    poolId: string,
    date: string,
    startTime: string,
    endTime: string
  ): AvailabilitySlot | null {
    const rows = this.getStmt.all(poolId, date, startTime, endTime) as any[];

    if (!rows.length) return null;

    const lanes: LaneAvailability[] = rows.map(row => ({
      laneId: row.lane_id,
      status: row.status,
      lastUpdated: row.last_updated
    }));

    const availableCount = lanes.filter(l => l.status === "available").length;

    return {
      poolId,
      date,
      startTime,
      endTime,
      lanes,
      availableCount
    };
  }

  updateAvailability(
    poolId: string,
    date: string,
    startTime: string,
    endTime: string,
    lanes: { id: number; status: string }[]
  ): void {
    const now = new Date().toISOString();

    // Use transaction for atomic updates
    const updateTx = this.db.transaction(() => {
      for (const lane of lanes) {
        this.insertStmt.run(poolId, lane.id, date, startTime, endTime, lane.status, now);
      }
    });

    updateTx();
  }

  cleanOldData(): number {
    const result = this.deleteOldStmt.run();
    return result.changes;
  }

  getAvailabilityTimeRange(poolId: string, date: string): { startTime: string; endTime: string }[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT start_time, end_time FROM lane_availability
      WHERE pool_id = ? AND date = ?
      ORDER BY start_time
    `);

    return (stmt.all(poolId, date) as any[]).map(row => ({
      startTime: row.start_time,
      endTime: row.end_time
    }));
  }
}
```

**`packages/db/src/queries/preferences.ts`** - User preferences:
```typescript
import type { Database } from "better-sqlite3";
import type { UserPreferences } from "@shared/types";

export class PreferencesQueries {
  private getStmt: Database.Statement;
  private updateFavoritesStmt: Database.Statement;
  private updateSlotDurationStmt: Database.Statement;

  constructor(private db: Database.Database) {
    this.getStmt = this.db.prepare("SELECT * FROM user_preferences WHERE id = 1");

    this.updateFavoritesStmt = this.db.prepare(`
      UPDATE user_preferences SET favorite_pools = ?, updated_at = ? WHERE id = 1
    `);

    this.updateSlotDurationStmt = this.db.prepare(`
      UPDATE user_preferences SET last_slot_duration = ?, updated_at = ? WHERE id = 1
    `);
  }

  getPreferences(): UserPreferences | null {
    const row = this.getStmt.get() as any;
    if (!row) return null;

    return {
      favoritePools: JSON.parse(row.favorite_pools),
      lastSlotDuration: row.last_slot_duration,
      lastSearchDate: row.last_search_date
    };
  }

  addFavoritePool(poolId: string): void {
    const prefs = this.getPreferences();
    if (!prefs) return;

    if (!prefs.favoritePools.includes(poolId)) {
      prefs.favoritePools.push(poolId);
      this.updateFavoritesStmt.run(
        JSON.stringify(prefs.favoritePools),
        new Date().toISOString()
      );
    }
  }

  removeFavoritePool(poolId: string): void {
    const prefs = this.getPreferences();
    if (!prefs) return;

    prefs.favoritePools = prefs.favoritePools.filter(id => id !== poolId);
    this.updateFavoritesStmt.run(
      JSON.stringify(prefs.favoritePools),
      new Date().toISOString()
    );
  }

  setLastSlotDuration(minutes: number): void {
    this.updateSlotDurationStmt.run(minutes, new Date().toISOString());
  }
}
```

---

## Part 2: Modular Scraper Architecture

### Design Pattern: Strategy + Factory

The goal is to make it trivial to add new pool scrapers without modifying existing code.

### Base Scraper Class

**`apps/backend/src/scrapers/base.ts`**:
```typescript
import type { Database } from "better-sqlite3";
import type { ScraperResult } from "@shared/types";

export interface ScraperConfig {
  poolId: string;
  url: string;
  timeoutMs?: number;
}

export interface ScraperLaneInfo {
  id: number;
  status: "available" | "booked" | "maintenance" | "unknown";
}

export abstract class BasePoolScraper {
  protected config: ScraperConfig;
  protected db: Database.Database;

  constructor(config: ScraperConfig, db: Database.Database) {
    this.config = config;
    this.db = db;
  }

  /**
   * Main scraping method to be implemented by subclasses
   */
  abstract scrape(date: string, timeSlots: string[]): Promise<ScraperResult>;

  /**
   * Fetch HTML from the pool website
   */
  protected async fetch(url: string): Promise<string> {
    const timeoutMs = this.config.timeoutMs || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Log scraper execution for debugging and monitoring
   */
  protected logExecution(status: "success" | "failed" | "partial", data: {
    rowsUpdated?: number;
    errorMessage?: string;
    executionTimeMs: number;
  }): void {
    this.db.prepare(`
      INSERT INTO scraper_logs (pool_id, scraper_type, status, error_message, rows_updated, execution_time_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      this.config.poolId,
      this.constructor.name,
      status,
      data.errorMessage || null,
      data.rowsUpdated || null,
      data.executionTimeMs,
      new Date().toISOString()
    );
  }

  /**
   * Parse time in HH:mm format
   */
  protected parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format minutes to HH:mm
   */
  protected formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }
}
```

### Example Scraper Implementation

**`apps/backend/src/scrapers/pool-a-scraper.ts`**:
```typescript
import { BasePoolScraper, type ScraperConfig } from "./base";
import type { Database } from "better-sqlite3";
import type { ScraperResult } from "@shared/types";
import * as cheerio from "cheerio";

/**
 * Scraper for Pool A (Example)
 *
 * Website: https://pool-a-example.com
 * Strategy:
 *   1. Fetch booking page with date parameter
 *   2. Parse HTML table with lane availability
 *   3. Extract status for each lane in given time slots
 */
export class PoolAScraper extends BasePoolScraper {
  constructor(config: ScraperConfig, db: Database.Database) {
    super(config, db);
  }

  async scrape(date: string, timeSlots: string[]): Promise<ScraperResult> {
    const startTime = performance.now();

    try {
      // Fetch booking page for the specified date
      const html = await this.fetch(`${this.config.url}?date=${date}`);

      // Parse HTML
      const $ = cheerio.load(html);

      const result: ScraperResult = {
        poolId: this.config.poolId,
        date,
        slots: []
      };

      // Example: Parse a table with lanes and time slots
      const rows = $("table tbody tr");

      rows.each((rowIdx, row) => {
        const cells = cheerio.load(row)("td");
        const timeCell = cheerio.load(cells[0]).text().trim();

        // Check if this is one of our requested time slots
        if (!timeSlots.includes(timeCell)) return;

        const lanes: any[] = [];

        // Parse each lane column (starting from index 1)
        cells.each((cellIdx, cell) => {
          if (cellIdx === 0) return; // Skip time column

          const $cell = cheerio.load(cell);
          const text = $cell.text().trim();
          const laneId = cellIdx; // Lane numbers start at 1

          let status: "available" | "booked" | "maintenance" | "unknown" = "unknown";

          if (text.toLowerCase().includes("available") || text === "✓") {
            status = "available";
          } else if (text.toLowerCase().includes("booked") || text === "✗") {
            status = "booked";
          } else if (text.toLowerCase().includes("maintenance")) {
            status = "maintenance";
          }

          lanes.push({ id: laneId, status });
        });

        if (lanes.length > 0) {
          const [startTime, endTime] = this.expandTimeSlot(timeCell);
          result.slots.push({
            startTime,
            endTime,
            lanes
          });
        }
      });

      const executionTimeMs = performance.now() - startTime;
      const totalLanesUpdated = result.slots.reduce((sum, slot) => sum + slot.lanes.length, 0);

      this.logExecution("success", {
        rowsUpdated: totalLanesUpdated,
        executionTimeMs: Math.round(executionTimeMs)
      });

      return result;
    } catch (error) {
      const executionTimeMs = performance.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      this.logExecution("failed", {
        errorMessage: errorMsg,
        executionTimeMs: Math.round(executionTimeMs)
      });

      throw error;
    }
  }

  /**
   * Expand a 30-minute slot notation to start/end times
   * Example: "14:30" becomes ["14:30", "15:00"]
   */
  private expandTimeSlot(startTime: string): [string, string] {
    const [hours, minutes] = startTime.split(":").map(Number);
    const start = hours * 60 + minutes;
    const end = start + 30; // 30-minute slots

    const endHours = Math.floor(end / 60);
    const endMinutes = end % 60;

    return [
      startTime,
      `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`
    ];
  }
}
```

### Scraper Factory & Registry

**`apps/backend/src/scrapers/factory.ts`**:
```typescript
import type { Database } from "better-sqlite3";
import { BasePoolScraper, type ScraperConfig } from "./base";
import { PoolAScraper } from "./pool-a-scraper";
import { PoolBScraper } from "./pool-b-scraper";

export type ScraperType = "pool-a" | "pool-b" | "pool-c"; // Add new scrapers here

export const SCRAPER_REGISTRY: Record<ScraperType, typeof BasePoolScraper> = {
  "pool-a": PoolAScraper,
  "pool-b": PoolBScraper,
  // Add new scraper classes here
};

export class ScraperFactory {
  static createScraper(type: ScraperType, config: ScraperConfig, db: Database.Database): BasePoolScraper {
    const ScraperClass = SCRAPER_REGISTRY[type];

    if (!ScraperClass) {
      throw new Error(`Unknown scraper type: ${type}`);
    }

    return new ScraperClass(config, db);
  }

  static getSupportedScrapers(): ScraperType[] {
    return Object.keys(SCRAPER_REGISTRY) as ScraperType[];
  }
}
```

### Scraper Service

**`apps/backend/src/services/scraper.service.ts`**:
```typescript
import type { Database } from "better-sqlite3";
import { ScraperFactory, type ScraperType } from "../scrapers/factory";
import { AvailabilityQueries, PoolQueries } from "@db";

export class ScraperService {
  constructor(private db: Database.Database) {}

  /**
   * Scrape availability for a specific pool and time range
   */
  async scrapePool(
    poolId: string,
    date: string,
    timeSlots: string[]
  ): Promise<{ success: boolean; rowsUpdated: number; error?: string }> {
    const poolQueries = new PoolQueries(this.db);
    const pool = poolQueries.getPoolById(poolId);

    if (!pool) {
      return { success: false, rowsUpdated: 0, error: "Pool not found" };
    }

    try {
      const scraper = ScraperFactory.createScraper(
        pool.scraperType as ScraperType,
        { poolId, url: `https://example.com/pool/${poolId}` },
        this.db
      );

      const result = await scraper.scrape(date, timeSlots);

      // Store results in database
      const availabilityQueries = new AvailabilityQueries(this.db);
      let rowsUpdated = 0;

      for (const slot of result.slots) {
        availabilityQueries.updateAvailability(
          poolId,
          date,
          slot.startTime,
          slot.endTime,
          slot.lanes
        );
        rowsUpdated += slot.lanes.length;
      }

      return { success: true, rowsUpdated };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return { success: false, rowsUpdated: 0, error: errorMsg };
    }
  }

  /**
   * Scrape all pools for a given date
   */
  async scrapeAllPools(date: string, timeSlots: string[]): Promise<Map<string, { success: boolean; error?: string }>> {
    const poolQueries = new PoolQueries(this.db);
    const pools = poolQueries.getAllPools();

    const results = new Map<string, { success: boolean; error?: string }>();

    for (const pool of pools) {
      try {
        const result = await this.scrapePool(pool.id, date, timeSlots);
        results.set(pool.id, {
          success: result.success,
          error: result.error
        });
      } catch (error) {
        results.set(pool.id, {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return results;
  }
}
```

### Adding a New Scraper

To add support for a new pool:

1. **Create scraper file**:
```typescript
// apps/backend/src/scrapers/pool-c-scraper.ts
import { BasePoolScraper } from "./base";
import type { Database } from "better-sqlite3";
import type { ScraperResult } from "@shared/types";

export class PoolCScraper extends BasePoolScraper {
  async scrape(date: string, timeSlots: string[]): Promise<ScraperResult> {
    // Implement pool-specific logic
  }
}
```

2. **Register in factory**:
```typescript
// apps/backend/src/scrapers/factory.ts
import { PoolCScraper } from "./pool-c-scraper";

export type ScraperType = "pool-a" | "pool-b" | "pool-c";

export const SCRAPER_REGISTRY = {
  "pool-a": PoolAScraper,
  "pool-b": PoolBScraper,
  "pool-c": PoolCScraper  // ← Add here
};
```

3. **Use in API**:
```typescript
// apps/backend/src/routes/scraper.ts
app.post("/api/scrape", async (req, res) => {
  const scraperService = new ScraperService(db);
  const result = await scraperService.scrapePool(
    req.body.poolId,
    req.body.date,
    req.body.timeSlots
  );
  res.json(result);
});
```

---

## Part 3: Background Scraping

### Scheduled Scraper (Simple cron)

```bash
pnpm add -F @swim-check/backend node-cron
```

**`apps/backend/src/jobs/scraper.job.ts`**:
```typescript
import cron from "node-cron";
import { ScraperService } from "../services/scraper.service";
import type { Database } from "better-sqlite3";

export function scheduleScrapers(db: Database.Database) {
  const scraperService = new ScraperService(db);

  // Run daily at 6 AM, noon, and 6 PM
  const schedule = "0 6,12,18 * * *";

  cron.schedule(schedule, async () => {
    console.log("🔄 Starting scheduled scrape...");

    const today = new Date().toISOString().split("T")[0];
    const timeSlots = generateTimeSlots("07:00", "22:00", 30); // 30-minute intervals

    try {
      const results = await scraperService.scrapeAllPools(today, timeSlots);

      for (const [poolId, result] of results) {
        if (result.success) {
          console.log(`✓ Scraped ${poolId}`);
        } else {
          console.error(`✗ Failed to scrape ${poolId}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("✗ Scheduled scraper failed:", error);
    }
  });

  console.log(`✓ Scraper scheduled: ${schedule}`);
}

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  let current = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  while (current < endTime) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    current += intervalMinutes;
  }

  return slots;
}
```

### Manual Scrape Endpoint

```typescript
// apps/backend/src/routes/scraper.ts
import express from "express";
import { ScraperService } from "../services/scraper.service";
import { db } from "@db";

const router = express.Router();
const scraperService = new ScraperService(db);

router.post("/scrape/:poolId", async (req, res) => {
  const { poolId } = req.params;
  const { date, timeSlots } = req.body;

  if (!date || !Array.isArray(timeSlots)) {
    return res.status(400).json({ error: "Missing date or timeSlots" });
  }

  try {
    const result = await scraperService.scrapePool(poolId, date, timeSlots);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
```

---

## Summary: Adding a New Pool

**Time required**: ~30 minutes

1. **Analyze pool website** → Understand booking page structure
2. **Create scraper class** → Extend `BasePoolScraper` (~50 lines)
3. **Register in factory** → Add 2 lines to factory
4. **Test** → Call new scraper via endpoint
5. **Deploy** → Done!

Example: [PoolAScraper](./DATABASE_AND_SCRAPERS.md) shows the full pattern.

