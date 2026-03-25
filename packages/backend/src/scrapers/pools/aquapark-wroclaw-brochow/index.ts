/**
 * Aquapark Wrocław Brochów scraper implementation
 * Fetches PDF schedule and parses lane availability for Basen Rekreacyjny
 * Reuses the same PDF parser as Aquapark Borowska (identical PDF schema)
 */

import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability, ResolvedSourceLink } from '@swim-check/shared';
import { parsePdfBuffer, filterSlotsForTimeSlot, type ParsedSchedule } from '../aquapark-wroclaw-borowska/parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';
import * as cheerio from 'cheerio';

// Pool configuration
export const AQUAPARK_BROCHOW_POOL_ID = '00000000-0000-0000-0000-000000000005';
export const AQUAPARK_BROCHOW_BASE_URL = 'https://aquapark.wroc.pl';
export const AQUAPARK_BROCHOW_SCHEDULE_URL = 'https://aquapark.wroc.pl/pl/grafik-brochow';

// Internal parsed-data cache to avoid redundant PDF downloads during pre-population loop
const PARSED_CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface ParsedDataCache {
  parsedSchedule: ParsedSchedule;
  pdfUrl: string;
  fetchedAt: number;
}

let parsedDataCache: ParsedDataCache | null = null;

export class AquaparkWroclawBrochowScraper implements PoolScraper {
  readonly poolId = AQUAPARK_BROCHOW_POOL_ID;
  readonly name = 'aquapark-wroclaw-brochow';
  readonly version = '1.0.0';
  readonly sourceUrls = [
    { url: AQUAPARK_BROCHOW_SCHEDULE_URL, label: 'Schedule Page' },
  ];

  private lastResolvedPdfUrl: string | null = null;

  async fetchAvailability(date: Date, timeSlot: TimeSlot): Promise<LaneAvailability[]> {
    const lanes = getLanesByPoolId(this.poolId);
    const laneIds = new Map<number, string>();
    lanes.forEach((lane) => laneIds.set(lane.laneNumber, lane.id));

    if (lanes.length === 0) {
      console.warn('Aquapark Brochów pool not found in database - needs seeding');
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
        const pdfUrl = await this.findPdfUrl();

        if (!pdfUrl) {
          console.warn('Could not find PDF URL on Brochów schedule page');
          this.lastResolvedPdfUrl = null;
          return this.getDefaultAvailability(laneIds);
        }

        this.lastResolvedPdfUrl = pdfUrl;

        const pdfBuffer = await this.downloadPdf(pdfUrl);
        parsedSchedule = await parsePdfBuffer(pdfBuffer);

        // Update cache
        parsedDataCache = { parsedSchedule, pdfUrl, fetchedAt: now_ms };
      }

      return filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);
    } catch (error) {
      console.error('Error fetching Aquapark Brochów availability:', error);
      return this.getDefaultAvailability(laneIds);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(AQUAPARK_BROCHOW_SCHEDULE_URL, {
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
      const response = await fetch(AQUAPARK_BROCHOW_SCHEDULE_URL, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedule page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Filter for recreation pool PDFs only (contains "rekreacyjn" in href)
      const pdfLinks = $('a[href$=".pdf"]').filter((_, el) => {
        const href = $(el).attr('href') || '';
        return href.toLowerCase().includes('rekreacyjn');
      });

      // Take the last link (most recent schedule)
      const pdfLink = pdfLinks.last().attr('href');

      if (!pdfLink) {
        // Fallback: try any PDF link with "rekreacyjn" in text
        const anyPdfLink = $('a').filter((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text() || '';
          return href.toLowerCase().includes('.pdf') &&
            (href.toLowerCase().includes('rekreacyjn') || text.toLowerCase().includes('rekreacyjn'));
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
      return `${AQUAPARK_BROCHOW_BASE_URL}${url}`;
    }
    return `${AQUAPARK_BROCHOW_BASE_URL}/${url}`;
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
      isAvailable: true,
      lastUpdated: now,
    }));
  }

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

export const aquaparkWroclawBrochowScraper = new AquaparkWroclawBrochowScraper();

/**
 * Convert day-of-week indices (0=Monday, 6=Sunday) to actual YYYY-MM-DD dates for the current week.
 */
function dayIndicesToDates(dayIndices: number[]): string[] {
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  return dayIndices.map(dayIndex => {
    const diff = dayIndex - todayDayIndex;
    const date = new Date(today);
    date.setDate(today.getDate() + diff);
    return date.toISOString().split('T')[0];
  }).sort();
}
