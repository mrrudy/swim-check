/**
 * Aquapark Wrocław Borowska scraper implementation
 * Fetches PDF schedule and parses lane availability
 */

import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability, ResolvedSourceLink } from '@swim-check/shared';
import { parsePdfBuffer, filterSlotsForTimeSlot } from './parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';
import * as cheerio from 'cheerio';

// Pool configuration
export const AQUAPARK_POOL_ID = '00000000-0000-0000-0000-000000000002';
export const AQUAPARK_BASE_URL = 'https://aquapark.wroc.pl';
export const AQUAPARK_SCHEDULE_URL = 'https://aquapark.wroc.pl/pl/grafik-rezerwacji-basenu-sportowego';

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
      // Step 1: Fetch the schedule page to find the PDF URL
      const pdfUrl = await this.findPdfUrl();

      if (!pdfUrl) {
        console.warn('Could not find PDF URL on schedule page');
        this.lastResolvedPdfUrl = null;
        // Return default availability
        return this.getDefaultAvailability(laneIds);
      }

      // Track the discovered PDF URL (006-scraping-status-view)
      this.lastResolvedPdfUrl = pdfUrl;

      // Step 2: Download and parse the PDF
      const pdfBuffer = await this.downloadPdf(pdfUrl);

      // Step 3: Parse the PDF content with position awareness
      const parsedSchedule = await parsePdfBuffer(pdfBuffer);

      // Step 4: Filter for the requested time slot
      return filterSlotsForTimeSlot(parsedSchedule, date, timeSlot, laneIds);
    } catch (error) {
      console.error('Error fetching Aquapark availability:', error);
      // Return default availability on error
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
}

export const aquaparkWroclawScraper = new AquaparkWroclawScraper();
