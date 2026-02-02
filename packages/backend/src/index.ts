/**
 * Express server entry point for Swim Lane Booking Checker API
 */

import express from 'express';
import cors from 'cors';
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
import { createLanesForPool, getPoolById } from './db/queries.js';
import { startScheduler, checkAndScrapeOnStartup } from './services/scheduler.js';
import { scrapeAllPools } from './services/scrapeOrchestrator.js';
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

  // Start server
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`API available at http://localhost:${config.port}/api/v1`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
