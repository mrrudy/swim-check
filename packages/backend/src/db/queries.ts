/**
 * Database query functions for pool CRUD operations
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from './schema.js';
import type { SwimmingPool, Lane, UserPreferences } from '@swim-check/shared';

// Pool queries

export interface PoolRow {
  id: string;
  name: string;
  location: string;
  website_url: string;
  total_lanes: number;
  created_at: string;
  updated_at: string;
}

function rowToPool(row: PoolRow): SwimmingPool {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    websiteUrl: row.website_url,
    totalLanes: row.total_lanes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function getAllPools(search?: string, limit = 50, offset = 0): { pools: SwimmingPool[]; total: number } {
  const db = getDatabase();

  let whereClause = '';
  const params: (string | number)[] = [];

  if (search) {
    whereClause = 'WHERE name LIKE ? OR location LIKE ?';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Get total count
  const countResult = db.exec(`SELECT COUNT(*) as count FROM swimming_pools ${whereClause}`, params);
  const total = countResult[0]?.values[0]?.[0] as number || 0;

  // Get paginated results
  params.push(limit, offset);
  const result = db.exec(
    `SELECT * FROM swimming_pools ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
    params
  );

  if (!result[0]) {
    return { pools: [], total };
  }

  const columns = result[0].columns;
  const pools = result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return rowToPool(obj as unknown as PoolRow);
  });

  return { pools, total };
}

export function getPoolById(id: string): SwimmingPool | null {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM swimming_pools WHERE id = ?', [id]);

  if (!result[0] || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });

  return rowToPool(obj as unknown as PoolRow);
}

export function createPool(pool: Omit<SwimmingPool, 'id' | 'createdAt' | 'updatedAt'>): SwimmingPool {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO swimming_pools (id, name, location, website_url, total_lanes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, pool.name, pool.location, pool.websiteUrl, pool.totalLanes, now, now]
  );
  saveDatabase();

  return {
    id,
    ...pool,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

// Lane queries

export interface LaneRow {
  id: string;
  pool_id: string;
  lane_number: number;
  label: string | null;
}

function rowToLane(row: LaneRow): Lane {
  return {
    id: row.id,
    poolId: row.pool_id,
    laneNumber: row.lane_number,
    label: row.label ?? undefined,
  };
}

export function getLanesByPoolId(poolId: string): Lane[] {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM lanes WHERE pool_id = ? ORDER BY lane_number', [poolId]);

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return rowToLane(obj as unknown as LaneRow);
  });
}

export function createLane(lane: Omit<Lane, 'id'>): Lane {
  const db = getDatabase();
  const id = uuidv4();

  db.run(
    `INSERT INTO lanes (id, pool_id, lane_number, label) VALUES (?, ?, ?, ?)`,
    [id, lane.poolId, lane.laneNumber, lane.label ?? null]
  );
  saveDatabase();

  return { id, ...lane };
}

export function createLanesForPool(poolId: string, totalLanes: number): Lane[] {
  const lanes: Lane[] = [];
  for (let i = 1; i <= totalLanes; i++) {
    lanes.push(createLane({ poolId, laneNumber: i }));
  }
  return lanes;
}

// User preferences queries

export interface PreferencesRow {
  id: string;
  slot_duration_mins: number;
  compact_view_enabled: number; // SQLite stores booleans as 0/1
  forward_slot_count: number;
  created_at: string;
  updated_at: string;
}

/** Extended UserPreferences with view options (005-pool-view-options) */
export interface ExtendedUserPreferences extends UserPreferences {
  compactViewEnabled: boolean;
  forwardSlotCount: number;
}

function rowToPreferences(row: PreferencesRow): ExtendedUserPreferences {
  return {
    id: row.id,
    slotDurationMins: row.slot_duration_mins,
    compactViewEnabled: row.compact_view_enabled === 1,
    forwardSlotCount: row.forward_slot_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function getOrCreatePreferences(): ExtendedUserPreferences {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM user_preferences LIMIT 1');

  if (result[0] && result[0].values.length > 0) {
    const columns = result[0].columns;
    const row = result[0].values[0];
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return rowToPreferences(obj as unknown as PreferencesRow);
  }

  // Create default preferences with view options defaults
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO user_preferences (id, slot_duration_mins, compact_view_enabled, forward_slot_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, 60, 1, 1, now, now]
  );
  saveDatabase();

  return {
    id,
    slotDurationMins: 60,
    compactViewEnabled: true,
    forwardSlotCount: 1,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

/** Update preferences including view options (005-pool-view-options) */
export interface UpdatePreferencesInput {
  slotDurationMins?: number;
  compactViewEnabled?: boolean;
  forwardSlotCount?: number;
}

export function updatePreferences(updates: UpdatePreferencesInput): ExtendedUserPreferences {
  const prefs = getOrCreatePreferences();
  const db = getDatabase();
  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (updates.slotDurationMins !== undefined) {
    setClauses.push('slot_duration_mins = ?');
    params.push(updates.slotDurationMins);
  }

  if (updates.compactViewEnabled !== undefined) {
    setClauses.push('compact_view_enabled = ?');
    params.push(updates.compactViewEnabled ? 1 : 0);
  }

  if (updates.forwardSlotCount !== undefined) {
    // Clamp to valid range (1-10)
    const clampedCount = Math.max(1, Math.min(10, updates.forwardSlotCount));
    setClauses.push('forward_slot_count = ?');
    params.push(clampedCount);
  }

  if (setClauses.length > 0) {
    setClauses.push('updated_at = ?');
    params.push(now, prefs.id);

    db.run(
      `UPDATE user_preferences SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );
    saveDatabase();
  }

  return getOrCreatePreferences();
}

// Favorite pools queries

export interface FavoritePoolRow {
  preference_id: string;
  pool_id: string;
  added_at: string;
  display_order: number;
}

export function getFavorites(): Array<{ poolId: string; addedAt: Date; displayOrder: number }> {
  const prefs = getOrCreatePreferences();
  const db = getDatabase();
  const result = db.exec(
    'SELECT * FROM favorite_pools WHERE preference_id = ? ORDER BY display_order',
    [prefs.id]
  );

  if (!result[0]) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    const r = obj as unknown as FavoritePoolRow;
    return {
      poolId: r.pool_id,
      addedAt: new Date(r.added_at),
      displayOrder: r.display_order,
    };
  });
}

export function addFavorite(poolId: string): void {
  const prefs = getOrCreatePreferences();
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get max display order
  const result = db.exec(
    'SELECT MAX(display_order) as max_order FROM favorite_pools WHERE preference_id = ?',
    [prefs.id]
  );
  const maxOrder = (result[0]?.values[0]?.[0] as number) || 0;

  db.run(
    `INSERT INTO favorite_pools (preference_id, pool_id, added_at, display_order)
     VALUES (?, ?, ?, ?)`,
    [prefs.id, poolId, now, maxOrder + 1]
  );
  saveDatabase();
}

export function removeFavorite(poolId: string): boolean {
  const prefs = getOrCreatePreferences();
  const db = getDatabase();

  const before = db.exec(
    'SELECT COUNT(*) FROM favorite_pools WHERE preference_id = ? AND pool_id = ?',
    [prefs.id, poolId]
  );
  const countBefore = (before[0]?.values[0]?.[0] as number) || 0;

  if (countBefore === 0) {
    return false;
  }

  db.run('DELETE FROM favorite_pools WHERE preference_id = ? AND pool_id = ?', [prefs.id, poolId]);
  saveDatabase();
  return true;
}

export function reorderFavorites(poolIds: string[]): void {
  const prefs = getOrCreatePreferences();
  const db = getDatabase();

  poolIds.forEach((poolId, index) => {
    db.run(
      'UPDATE favorite_pools SET display_order = ? WHERE preference_id = ? AND pool_id = ?',
      [index, prefs.id, poolId]
    );
  });
  saveDatabase();
}
