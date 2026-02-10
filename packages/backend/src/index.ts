/**
 * Express server entry point for Swim Lane Booking Checker API
 */

import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config, validateConfig } from './config.js';
import { initializeDatabase, getDatabase, saveDatabase } from './db/schema.js';
import { errorHandler } from './api/routes.js';
import { healthRouter } from './api/health.js';
import { poolsRouter } from './api/pools.js';
import { availabilityRouter } from './api/availability.js';
import { favoritesRouter } from './api/favorites.js';
import { preferencesRouter } from './api/preferences.js';
import { adminRouter } from './api/admin.js';
import { scraperRegistry } from './scrapers/registry.js';
import { examplePoolScraper, EXAMPLE_POOL_ID } from './scrapers/pools/example/index.js';
import { aquaparkWroclawScraper, AQUAPARK_POOL_ID } from './scrapers/pools/aquapark-wroclaw-borowska/index.js';
import { slezaCentrumScraper, SLEZA_POOL_ID } from './scrapers/pools/sleza-centrum/index.js';
import { teatralnaBasen1Scraper, TEATRALNA_POOL_ID } from './scrapers/pools/teatralna-basen1/index.js';
import { createLanesForPool, getPoolById } from './db/queries.js';
import { startScheduler, startPerPoolIntervals, checkAndScrapeOnStartup } from './services/scheduler.js';
import { scrapeAllPools, scrapePool } from './services/scrapeOrchestrator.js';
import { resetAllScrapeStates } from './services/scrapeState.js';

// Validate configuration at startup
validateConfig();

async function seedPool(
  poolId: string,
  name: string,
  location: string,
  websiteUrl: string,
  totalLanes: number
) {
  const existing = getPoolById(poolId);
  if (!existing) {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO swimming_pools (id, name, location, website_url, total_lanes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [poolId, name, location, websiteUrl, totalLanes, now, now]
    );
    saveDatabase();

    // Create lanes
    createLanesForPool(poolId, totalLanes);

    console.log(`Seeded pool: ${name}`);
  }
}

async function seedPools() {
  // Seed example pool
  await seedPool(
    EXAMPLE_POOL_ID,
    'Example Pool',
    '123 Pool Lane, Example City',
    'https://example-pool.com',
    6
  );
  scraperRegistry.register(examplePoolScraper);
  console.log('Registered example pool scraper');

  // Seed Aquapark Wrocław
  await seedPool(
    AQUAPARK_POOL_ID,
    'Aquapark Wrocław - Basen Sportowy',
    'ul. Borowska 99, Wrocław',
    'https://aquapark.wroc.pl/pl/grafik-rezerwacji-basenu-sportowego',
    8
  );
  scraperRegistry.register(aquaparkWroclawScraper);
  console.log('Registered Aquapark Wrocław scraper');

  // Seed Centrum Ślęża
  await seedPool(
    SLEZA_POOL_ID,
    'Centrum Ślęża - Basen Sportowy',
    'ul. Sportowa 1, Sobótka',
    'https://www.centrumsleza.pl/grafiki/',
    6
  );
  scraperRegistry.register(slezaCentrumScraper);
  console.log('Registered Centrum Ślęża scraper');

  // Seed SPA Teatralna - Basen 1 (010-teatralna-pool-scraper)
  await seedPool(
    TEATRALNA_POOL_ID,
    'SPA Teatralna - Basen 1',
    'ul. Teatralna 10-12, Wrocław',
    'https://klient.spa.wroc.pl/index.php?s=basen_1',
    5
  );
  scraperRegistry.register(teatralnaBasen1Scraper);
  console.log('Registered SPA Teatralna - Basen 1 scraper');
}

async function main() {
  // Initialize database
  await initializeDatabase(config.dbPath);
  console.log(`Database initialized at ${config.dbPath}`);

  // Seed pools and register scrapers
  await seedPools();

  // Reset scrape states on startup (003-midnight-rescrape)
  resetAllScrapeStates();
  console.log('[Scheduler] Scrape states reset on startup');

  // Check if today's data needs scraping and start scheduler (003-midnight-rescrape)
  const startupCheck = await checkAndScrapeOnStartup();
  if (startupCheck.needsScrape) {
    console.log('[Scheduler] Triggering startup scrape...');
    // Run scrape in background (don't block server startup)
    scrapeAllPools(startupCheck.poolIds).catch((err) => {
      console.error('[Scheduler] Startup scrape failed:', err);
    });
  }

  // Start midnight scheduler
  startScheduler(() => {
    console.log('[Scheduler] Midnight trigger - starting scrape');
    scrapeAllPools().catch((err) => {
      console.error('[Scheduler] Midnight scrape failed:', err);
    });
  });

  // Start per-pool interval scrapers (010-teatralna-pool-scraper)
  startPerPoolIntervals((poolId) => {
    console.log(`[Scheduler] Per-pool interval trigger for ${poolId}`);
    scrapePool(poolId).catch((err) => {
      console.error(`[Scheduler] Per-pool interval scrape failed for ${poolId}:`, err);
    });
  });

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API routes (v1)
  const apiRouter = express.Router();
  apiRouter.use('/', healthRouter);
  apiRouter.use('/pools', poolsRouter);
  apiRouter.use('/pools', availabilityRouter);
  apiRouter.use('/favorites', favoritesRouter);
  apiRouter.use('/preferences', preferencesRouter);
  apiRouter.use('/admin', adminRouter);

  app.use('/api/v1', apiRouter);

  // Error handler
  app.use(errorHandler);

  // Serve frontend static files in production
  const frontendDist = resolve(import.meta.dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback - serve index.html for non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(resolve(frontendDist, 'index.html'));
    });
    console.log(`Serving frontend from ${frontendDist}`);
  }

  // Start server
  app.listen(config.port, config.host, () => {
    console.log(`Server running on http://${config.host}:${config.port}`);
    console.log(`API available at http://${config.host}:${config.port}/api/v1`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
