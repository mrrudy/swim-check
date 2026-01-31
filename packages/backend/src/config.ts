/**
 * Application configuration
 * Loads environment variables from .env file and exports typed config
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env file from backend package root
// This works for both dev (src/) and production (dist/)
const envPath = resolve(import.meta.dirname, '..', '.env');
dotenvConfig({ path: envPath });

// Also try loading from project root if backend .env doesn't exist
const rootEnvPath = resolve(import.meta.dirname, '..', '..', '..', '.env');
dotenvConfig({ path: rootEnvPath });

export interface Config {
  port: number;
  dbPath: string;
  googleSheetsApiKey: string | undefined;
}

function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    dbPath: process.env.DB_PATH || './swim-check.db',
    googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY,
  };
}

export const config = loadConfig();

/**
 * Validate that required configuration is present
 * Call this at startup to warn about missing config
 */
export function validateConfig(): void {
  if (!config.googleSheetsApiKey) {
    console.warn('Warning: GOOGLE_SHEETS_API_KEY not set - Sleza scraper will fail');
  }
}
