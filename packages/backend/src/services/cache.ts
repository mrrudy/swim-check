/**
 * CacheService for 5-minute TTL cache operations
 */

import { getDatabase, saveDatabase } from '../db/schema.js';

const DEFAULT_TTL_SECONDS = 5 * 60; // 5 minutes

export interface CacheEntry<T> {
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

export class CacheService {
  private ttlSeconds: number;

  constructor(ttlSeconds = DEFAULT_TTL_SECONDS) {
    this.ttlSeconds = ttlSeconds;
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns The cached value or null if not found/expired
   */
  get<T>(key: string): CacheEntry<T> | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    const result = db.exec(
      'SELECT value, expires_at, created_at FROM cache_entries WHERE key = ? AND expires_at > ?',
      [key, now]
    );

    if (!result[0] || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const value = JSON.parse(row[0] as string) as T;
    const expiresAt = new Date(row[1] as string);
    const createdAt = new Date(row[2] as string);

    return { value, expiresAt, createdAt };
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Optional TTL override
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const db = getDatabase();
    const now = new Date();
    const ttl = ttlSeconds ?? this.ttlSeconds;
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    db.run(
      `INSERT OR REPLACE INTO cache_entries (key, value, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
      [key, JSON.stringify(value), expiresAt.toISOString(), now.toISOString()]
    );
    saveDatabase();
  }

  /**
   * Delete a cache entry
   * @param key Cache key
   */
  delete(key: string): void {
    const db = getDatabase();
    db.run('DELETE FROM cache_entries WHERE key = ?', [key]);
    saveDatabase();
  }

  /**
   * Delete all expired entries
   */
  cleanup(): number {
    const db = getDatabase();
    const now = new Date().toISOString();

    const before = db.exec('SELECT COUNT(*) FROM cache_entries WHERE expires_at <= ?', [now]);
    const count = (before[0]?.values[0]?.[0] as number) || 0;

    db.run('DELETE FROM cache_entries WHERE expires_at <= ?', [now]);
    saveDatabase();

    return count;
  }

  /**
   * Check if a key exists and is not expired
   * @param key Cache key
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get value or compute and cache if missing
   * @param key Cache key
   * @param compute Function to compute the value if not cached
   * @param ttlSeconds Optional TTL override
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<{ value: T; fromCache: boolean }> {
    const cached = this.get<T>(key);
    if (cached) {
      return { value: cached.value, fromCache: true };
    }

    const value = await compute();
    this.set(key, value, ttlSeconds);
    return { value, fromCache: false };
  }
}

// Singleton instance for availability cache
export const availabilityCache = new CacheService(5 * 60); // 5 minutes

// Singleton instance for pool info cache
export const poolInfoCache = new CacheService(24 * 60 * 60); // 24 hours
