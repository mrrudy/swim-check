/**
 * ScraperRegistry - Central registry for pool scraper discovery and management
 */

import type { PoolScraper, PoolScraperMetadata } from './types.js';
import { getDatabase, saveDatabase } from '../db/schema.js';

export class ScraperRegistry {
  private scrapers: Map<string, PoolScraper> = new Map();

  /**
   * Register a scraper for a pool
   */
  register(scraper: PoolScraper): void {
    this.scrapers.set(scraper.poolId, scraper);
    this.updateScraperMetadata(scraper);
  }

  /**
   * Get a scraper by pool ID
   */
  get(poolId: string): PoolScraper | undefined {
    return this.scrapers.get(poolId);
  }

  /**
   * Check if a scraper exists for a pool
   */
  has(poolId: string): boolean {
    return this.scrapers.has(poolId);
  }

  /**
   * Get all registered scrapers
   */
  getAll(): PoolScraper[] {
    return Array.from(this.scrapers.values());
  }

  /**
   * Get metadata for all registered scrapers
   */
  getAllMetadata(): PoolScraperMetadata[] {
    return this.getAll().map((s) => ({
      poolId: s.poolId,
      name: s.name,
      version: s.version,
    }));
  }

  /**
   * Unregister a scraper
   */
  unregister(poolId: string): boolean {
    return this.scrapers.delete(poolId);
  }

  /**
   * Run health checks on all scrapers
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [poolId, scraper] of this.scrapers) {
      try {
        const healthy = await scraper.isHealthy();
        results.set(poolId, healthy);
        this.updateScraperHealth(poolId, healthy);
      } catch {
        results.set(poolId, false);
        this.updateScraperHealth(poolId, false);
      }
    }

    return results;
  }

  /**
   * Get health status summary
   */
  async getHealthSummary(): Promise<{ healthy: number; unhealthy: number }> {
    const healthResults = await this.healthCheckAll();
    let healthy = 0;
    let unhealthy = 0;

    for (const isHealthy of healthResults.values()) {
      if (isHealthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    }

    return { healthy, unhealthy };
  }

  private updateScraperMetadata(scraper: PoolScraper): void {
    const db = getDatabase();

    db.run(
      `INSERT OR REPLACE INTO pool_scrapers (pool_id, scraper_type, version, is_healthy)
       VALUES (?, ?, ?, ?)`,
      [scraper.poolId, scraper.name, scraper.version, 1]
    );
    saveDatabase();
  }

  private updateScraperHealth(poolId: string, isHealthy: boolean): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.run(
      `UPDATE pool_scrapers SET is_healthy = ?, last_health_check = ? WHERE pool_id = ?`,
      [isHealthy ? 1 : 0, now, poolId]
    );
    saveDatabase();
  }
}

// Singleton registry instance
export const scraperRegistry = new ScraperRegistry();
