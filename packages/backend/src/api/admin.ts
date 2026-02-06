/**
 * Admin API routes for rescrape and scheduler status (003-midnight-rescrape)
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, sendError, isValidUUID } from './routes.js';
import { getSchedulerState } from '../services/scheduler.js';
import { scrapeAllPools, triggerSinglePoolScrape } from '../services/scrapeOrchestrator.js';
import { getScrapeState, isAnyScrapeInProgress, getPoolsInProgress } from '../services/scrapeState.js';
import { getScrapeJob, getAllScrapeJobs } from '../db/scrapeJobs.js';
import { getPoolById, getAllPools } from '../db/queries.js';
import { scraperRegistry } from '../scrapers/registry.js';
import type {
  RescrapeResponse,
  SchedulerStatusResponse,
  PoolScrapeStatusResponse,
} from '@swim-check/shared';

export const adminRouter = Router();

/**
 * POST /admin/rescrape
 * Trigger manual rescrape of pool data
 *
 * Query params:
 * - poolId (optional): Specific pool to rescrape. If omitted, rescrapes all pools.
 *
 * Responses:
 * - 200: Rescrape initiated
 * - 404: Pool not found (when poolId specified)
 * - 409: Scrape already in progress
 */
adminRouter.post(
  '/rescrape',
  asyncHandler(async (req: Request, res: Response) => {
    const poolId = req.query.poolId as string | undefined;

    console.log(`[Admin] Manual rescrape requested${poolId ? ` for pool ${poolId}` : ' for all pools'}`);

    // Check if specific pool requested
    if (poolId) {
      // Validate UUID format
      if (!isValidUUID(poolId)) {
        sendError(res, 400, 'INVALID_PARAMETER', 'Invalid poolId format');
        return;
      }

      // Check pool exists
      const pool = getPoolById(poolId);
      if (!pool) {
        console.log(`[Admin] Pool not found: ${poolId}`);
        res.status(404).json({
          error: 'Pool not found',
          poolId,
        });
        return;
      }

      // Check if scraper exists for pool
      if (!scraperRegistry.has(poolId)) {
        console.log(`[Admin] No scraper registered for pool: ${poolId}`);
        res.status(404).json({
          error: 'No scraper registered for pool',
          poolId,
        });
        return;
      }

      // Check if this pool is already being scraped
      const scrapeState = getScrapeState(poolId);
      if (scrapeState.inProgress) {
        console.log(`[Admin] Scrape already in progress for pool: ${poolId}`);
        res.status(409).json({
          error: 'Scrape already in progress',
          poolId,
        });
        return;
      }

      // Trigger single pool scrape in background
      console.log(`[Admin] Triggering rescrape for pool: ${pool.name}`);
      triggerSinglePoolScrape(poolId).catch((err) => {
        console.error(`[Admin] Rescrape failed for pool ${poolId}:`, err);
      });

      const response: RescrapeResponse = {
        message: 'Rescrape started',
        pools: [{ poolId, poolName: pool.name }],
      };

      res.json(response);
      return;
    }

    // Rescrape all pools
    // Check if any scrape is in progress
    if (isAnyScrapeInProgress()) {
      const poolsInProgress = getPoolsInProgress();
      console.log(`[Admin] Scrape already in progress for pools: ${poolsInProgress.join(', ')}`);
      res.status(409).json({
        error: 'Scrape already in progress',
        poolId: poolsInProgress[0], // Return first pool in progress
      });
      return;
    }

    // Get all pools with scrapers
    const allScrapers = scraperRegistry.getAll();
    const pools = allScrapers
      .map((scraper) => {
        const pool = getPoolById(scraper.poolId);
        return pool ? { poolId: scraper.poolId, poolName: pool.name } : null;
      })
      .filter((p): p is { poolId: string; poolName: string } => p !== null);

    if (pools.length === 0) {
      console.log('[Admin] No pools with scrapers registered');
      sendError(res, 500, 'NO_POOLS', 'No pools with scrapers registered');
      return;
    }

    // Trigger rescrape for all pools in background
    console.log(`[Admin] Triggering rescrape for ${pools.length} pools`);
    scrapeAllPools().catch((err) => {
      console.error('[Admin] Rescrape all pools failed:', err);
    });

    const response: RescrapeResponse = {
      message: 'Rescrape started',
      pools,
    };

    res.json(response);
  })
);

/**
 * GET /admin/scheduler/status
 * Get current scheduler status and per-pool scrape status
 * Extended in 006-scraping-status-view with timestamp, error message, and source URLs
 */
adminRouter.get(
  '/scheduler/status',
  asyncHandler(async (_req: Request, res: Response) => {
    const schedulerState = getSchedulerState();
    const allScrapers = scraperRegistry.getAll();

    // Build pool statuses
    const poolStatuses: PoolScrapeStatusResponse[] = allScrapers.map((scraper) => {
      const pool = getPoolById(scraper.poolId);
      const scrapeJob = getScrapeJob(scraper.poolId);
      const scrapeState = getScrapeState(scraper.poolId);

      // Merge static source URLs with resolved source URLs (006-scraping-status-view)
      // Resolved URLs (e.g., discovered PDF link) take precedence and are shown first
      const staticUrls = scraper.sourceUrls ?? [];
      const resolvedUrls = scrapeJob?.resolvedSourceUrls ?? [];
      const mergedSourceUrls = [...resolvedUrls, ...staticUrls];

      return {
        poolId: scraper.poolId,
        poolName: pool?.name ?? 'Unknown',
        lastScrapeDate: scrapeJob?.lastScrapeDate ?? null,
        lastScrapeTimestamp: scrapeJob?.lastScrapeTimestamp?.toISOString() ?? null, // 006-scraping-status-view
        lastScrapeStatus: scrapeJob?.lastScrapeStatus ?? null,
        lastErrorMessage: scrapeJob?.lastErrorMessage ?? null, // 006-scraping-status-view
        inProgress: scrapeState.inProgress,
        sourceUrls: mergedSourceUrls, // 006-scraping-status-view: includes both resolved and static URLs
      };
    });

    const response: SchedulerStatusResponse = {
      isRunning: schedulerState.isRunning,
      nextScheduledRun: schedulerState.nextScheduledRun?.toISOString() ?? null,
      lastRunTimestamp: schedulerState.lastRunTimestamp?.toISOString() ?? null,
      poolStatuses,
    };

    res.json(response);
  })
);
