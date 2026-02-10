/**
 * Teatralna Basen 1 pool scraper (010-teatralna-pool-scraper)
 *
 * Scrapes the klient.spa.wroc.pl booking system for Basen 1 lane availability.
 * Converts spot counts to lane equivalents (30 spots = 5 lanes of 6 spots each).
 * Maps hourly data to 30-minute slots for system consistency.
 */

import type { PoolScraper } from '../../types.js';
import type {
  TimeSlot,
  LaneAvailability,
  ResolvedSourceLink,
} from '@swim-check/shared';
import { getLanesByPoolId } from '../../../db/queries.js';
import { TEATRALNA_CONFIG } from './config.js';
import {
  parseScheduleTable,
  spotsToLanes,
} from './parser.js';

export const TEATRALNA_POOL_ID = TEATRALNA_CONFIG.POOL_ID;

export class TeatralnaBasen1Scraper implements PoolScraper {
  readonly poolId = TEATRALNA_CONFIG.POOL_ID;
  readonly name = 'teatralna-basen1';
  readonly version = '1.0.0';
  readonly sourceUrls = [
    { url: TEATRALNA_CONFIG.SCHEDULE_URL, label: 'Booking Page' },
  ];
  readonly scrapeIntervalHours = TEATRALNA_CONFIG.SCRAPE_INTERVAL_HOURS;

  async fetchAvailability(
    date: Date,
    timeSlot: TimeSlot
  ): Promise<LaneAvailability[]> {
    const lanes = getLanesByPoolId(this.poolId);
    const laneIds = new Map<number, string>();
    lanes.forEach((lane) => laneIds.set(lane.laneNumber, lane.id));

    if (lanes.length === 0) {
      console.warn('[Teatralna] Pool not found in database — needs seeding');
      return [];
    }

    // Format date for URL parameter
    const dateStr = date.toISOString().split('T')[0];

    // Fetch the full booking page which contains the table#schedule grid.
    // The AJAX endpoint (ajax_calendar.php) returns a different HTML format
    // (timetable-list panels) that doesn't match the parser's expected structure.
    const url = `${TEATRALNA_CONFIG.SCHEDULE_URL}&date=${dateStr}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `[Teatralna] HTTP ${response.status} fetching schedule`
      );
    }

    const html = await response.text();

    // The upstream server returns 200 with an error div when its backend is down
    if (html.includes('alert-danger') && html.includes('Wystąpił błąd')) {
      throw new Error(
        '[Teatralna] Upstream server error — SPA booking system returned an error page'
      );
    }

    // Parse the schedule table
    const parsedDays = parseScheduleTable(html);

    // Find the day matching the requested date
    const targetDay = parsedDays.find((d) => d.date === dateStr);
    if (!targetDay) {
      return [];
    }

    // Filter slots within the requested time range and convert to LaneAvailability.
    // Use a Map keyed by laneId to deduplicate across half-hour sub-slots
    // (each hourly source slot maps to two 30-min slots). When multiple sub-slots
    // fall within the requested range, take the worst-case (unavailable wins).
    const laneMap = new Map<string, LaneAvailability>();
    const now = new Date();

    const requestedStart = timeToMinutes(timeSlot.startTime);
    const requestedEnd = timeToMinutes(timeSlot.endTime);

    for (const slot of targetDay.slots) {
      if (!slot.isActive) {
        // Inactive slots: all lanes unavailable, mapped to two 30-min slots
        const halfHours = getHalfHourSlots(slot.hour);

        for (const halfHour of halfHours) {
          const halfMinutes = timeToMinutes(halfHour);
          if (halfMinutes < requestedStart || halfMinutes >= requestedEnd)
            continue;

          for (const [laneNumber, laneId] of laneIds) {
            laneMap.set(laneId, {
              laneId,
              laneNumber,
              isAvailable: false,
              lastUpdated: now,
            });
          }
        }
        continue;
      }

      // Convert spots to lanes
      const availableLaneCount = spotsToLanes(
        slot.freeSpots,
        TEATRALNA_CONFIG.SPOTS_PER_LANE
      );

      // Map hourly slot to two 30-minute slots
      const halfHours = getHalfHourSlots(slot.hour);

      for (const halfHour of halfHours) {
        const halfMinutes = timeToMinutes(halfHour);
        if (halfMinutes < requestedStart || halfMinutes >= requestedEnd)
          continue;

        // Mark first N lanes as available, rest as unavailable.
        // If a lane was already marked unavailable by a prior sub-slot, keep it unavailable.
        for (const [laneNumber, laneId] of laneIds) {
          const existing = laneMap.get(laneId);
          const isAvailable = laneNumber <= availableLaneCount;
          laneMap.set(laneId, {
            laneId,
            laneNumber,
            isAvailable: existing ? existing.isAvailable && isAvailable : isAvailable,
            lastUpdated: now,
          });
        }
      }
    }

    return Array.from(laneMap.values());
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(TEATRALNA_CONFIG.SCHEDULE_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getResolvedSourceUrls(): ResolvedSourceLink[] | undefined {
    return [
      { url: TEATRALNA_CONFIG.SCHEDULE_URL, label: 'Booking Page' },
    ];
  }
}

export const teatralnaBasen1Scraper = new TeatralnaBasen1Scraper();

/** Convert "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Generate two 30-minute slot start times from an hourly slot */
function getHalfHourSlots(hour: string): string[] {
  const [h] = hour.split(':').map(Number);
  const hStr = h.toString().padStart(2, '0');
  const nextH = (h + 1).toString().padStart(2, '0');
  return [`${hStr}:00`, `${hStr}:30`];
}
