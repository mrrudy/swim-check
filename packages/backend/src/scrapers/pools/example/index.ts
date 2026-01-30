/**
 * Example pool scraper implementation
 * Demonstrates the PoolScraper interface pattern
 */

import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability } from '@swim-check/shared';
import { parseAvailabilityHtml } from './parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';

// Example pool ID - in production this would be in the database
export const EXAMPLE_POOL_ID = '00000000-0000-0000-0000-000000000001';
export const EXAMPLE_POOL_URL = 'https://example-pool.com/availability';

export class ExamplePoolScraper implements PoolScraper {
  readonly poolId = EXAMPLE_POOL_ID;
  readonly name = 'example-pool';
  readonly version = '1.0.0';

  async fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]> {
    // In a real scraper, this would:
    // 1. Fetch the HTML from the pool's website
    // 2. Parse the HTML to extract booking information
    // 3. Filter for the requested date and time slot

    // For the example, we'll generate mock data
    const lanes = getLanesByPoolId(this.poolId);
    const laneIds = new Map<number, string>();
    lanes.forEach((lane) => laneIds.set(lane.laneNumber, lane.id));

    // If no lanes exist, return empty
    if (lanes.length === 0) {
      return [];
    }

    // Generate mock availability (alternating available/booked)
    const now = new Date();
    return lanes.map((lane, index) => ({
      laneId: lane.id,
      laneNumber: lane.laneNumber,
      label: lane.label,
      isAvailable: index % 3 !== 0, // Every 3rd lane is "booked"
      lastUpdated: now,
    }));
  }

  async isHealthy(): Promise<boolean> {
    // In a real scraper, this would check if the pool's website is reachable
    // For the example, we always return true
    return true;
  }
}

export const examplePoolScraper = new ExamplePoolScraper();
