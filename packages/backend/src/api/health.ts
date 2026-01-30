/**
 * Health check endpoint with scraper status
 */

import { Router, Request, Response } from 'express';
import type { HealthResponse } from '@swim-check/shared';
import { asyncHandler } from './routes.js';
import { scraperRegistry } from '../scrapers/registry.js';

export const healthRouter = Router();

healthRouter.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  // Get scraper health status
  const scraperHealth = await scraperRegistry.getHealthSummary();
  const status = scraperHealth.unhealthy > 0 ? 'degraded' : 'healthy';

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    scrapers: scraperHealth,
  };

  res.json(response);
}));
