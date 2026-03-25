/**
 * Aquapark Wrocław Borowska scraper implementation
 * Fetches PDF schedule and parses lane availability
 */

import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability, ResolvedSourceLink } from '@swim-check/shared';
import { parsePdfBuffer, filterSlotsForTimeSlot, type ParsedSchedule } from './parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';
import * as cheerio from 'cheerio';

// Pool configuration
export const AQUAPARK_POOL_ID = '00000000-0000-0000-0000-000000000002';
export const AQUAPARK_BASE_URL = 'https://aquapark.wroc.pl';
export const AQUAPARK_SCHEDULE_URL = 'https://aquapark.wroc.pl/pl/grafik-rezerwacji-basenu-sportowego';

// Internal parsed-data cache to avoid redundant PDF downloads during pre-population loop
const PARSED_CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface ParsedDataCache {
  parsedSchedule: ParsedSchedule;
  pdfUrl: string;
  fetchedAt: number;
}

let parsedDataCache: ParsedDataCache | null = null;

export class AquaparkWroclawScraper implements PoolScraper {
  readonly poolId = AQUAPARK_POOL_ID;
  readonly name = 'aquapark-wroclaw-borowska';
  readonly version = '1.0.0';
  readonly sourceUrls = [
    { url: AQUAPARK_SCHEDULE_URL, label: 'Schedule Page' },
  ];

  // Track the last resolved PDF URL (006-scraping-status-view)
  private lastResolvedPdfUrl: string | null = null;

  async fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]> {
    const lanes = getLanesByPoolId(this.poolId);
    const laneIds = new Map<number, string>();
    lanes.forEach((lane) => laneIds.set(lane.laneNumber, lane.id));

    // If no lanes in DB, return empty (pool not seeded yet)
    if (lanes.length === 0) {
      console.warn('Aquapark pool not found in database - needs seeding');
      return [];
    }

    try {
      // Use cached parsed data if available and fresh (avoids redundant PDF downloads during pre-population)
      let parsedSchedule: ParsedSchedule;
      const now_ms = Date.now();

      if (parsedDataCache && (now_ms - parsedDataCache.fetchedAt) < PARSED_CACHE_TTL_MS) {
        parsedSchedule = parsedDataCache.parsedSchedule;
        this.lastResolvedPdfUrl = parsedDataCache.pdfUrl;
      } else {
        // Step 1: Fetch the schedule page to find the PDF URL
        const pdfUrl = await this.findPdfUrl();

        if (!pdfUrl) {
          console.warn('Could not find PDF URL on schedule page');
          this.lastResolvedPdfUrl = null;
          return this.getDefaultAvailability(laneIds);
        }

        this.lastResolvedPdfUrl = pdfUrl;

        // Step 2: Download and parse the PDF
        const pdfBuffer = await this.downloadPdf(pdfUrl);
        parsedSchedule = await parsePdfBuffer(pdfBuffer);

        // Update cache
        parsedDataCache = { parsedSchedule, pdfUrl, fetchedAt: now_ms };
      }

      // Filter for the requested time slot
      return filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);
    } catch (error) {
      console.error('Error fetching Aquapark availability:', error);
      return this.getDefaultAvailability(laneIds);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(AQUAPARK_SCHEDULE_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async findPdfUrl(): Promise<string | null> {
    try {
      const response = await fetch(AQUAPARK_SCHEDULE_URL, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedule page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Look for PDF links on the page (last link = most recent schedule)
      const pdfLink = $('a[href$=".pdf"]').last().attr('href');

      if (!pdfLink) {
        // Try alternative selectors
        const anyPdfLink = $('a').filter((_, el) => {
          const href = $(el).attr('href') || '';
          return href.toLowerCase().includes('.pdf');
        }).last().attr('href');

        if (anyPdfLink) {
          return this.resolveUrl(anyPdfLink);
        }
        return null;
      }

      return this.resolveUrl(pdfLink);
    } catch (error) {
      console.error('Error finding PDF URL:', error);
      return null;
    }
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${AQUAPARK_BASE_URL}${url}`;
    }
    return `${AQUAPARK_BASE_URL}/${url}`;
  }

  private async downloadPdf(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private getDefaultAvailability(laneIds: Map<number, string>): LaneAvailability[] {
    const now = new Date();
    return Array.from(laneIds.entries()).map(([laneNumber, laneId]) => ({
      laneId,
      laneNumber,
      isAvailable: true, // Assume available when we can't fetch data
      lastUpdated: now,
    }));
  }

  /**
   * Get the resolved PDF URL discovered during the last scrape (006-scraping-status-view)
   */
  getResolvedSourceUrls(): ResolvedSourceLink[] | undefined {
    if (!this.lastResolvedPdfUrl) {
      return undefined;
    }
    return [
      { url: this.lastResolvedPdfUrl, label: 'PDF Schedule' },
    ];
  }

  getAvailableDates(): string[] {
    if (!parsedDataCache) return [];
    return dayIndicesToDates(parsedDataCache.parsedSchedule.days.map(d => d.dayIndex));
  }
}

export const aquaparkWroclawScraper = new AquaparkWroclawScraper();

/**
 * Convert day-of-week indices (0=Monday, 6=Sunday) to actual YYYY-MM-DD dates for the current week.
 */
function dayIndicesToDates(dayIndices: number[]): string[] {
  const today = new Date();
  // JS getDay: 0=Sun, 1=Mon ... 6=Sat → convert to 0=Mon index
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return dayIndices.map(dayIndex => {
    const diff = dayIndex - todayDayIndex;
    const date = new Date(today);
    date.setDate(today.getDate() + diff);
    return date.toISOString().split('T')[0];
  }).sort();
}
