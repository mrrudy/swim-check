/**
 * Aquapark Wrocław Brochów scraper implementation
 * Fetches PDF schedule and parses lane availability for Basen Rekreacyjny
 * Reuses the same PDF parser as Aquapark Borowska (identical PDF schema)
 */

import type { PoolScraper } from '../../types.js';
import type { TimeSlot, LaneAvailability, ResolvedSourceLink } from '@swim-check/shared';
import { parsePdfBuffer, filterSlotsForTimeSlot } from '../aquapark-wroclaw-borowska/parser.js';
import { getLanesByPoolId } from '../../../db/queries.js';
import * as cheerio from 'cheerio';

// Pool configuration
export const AQUAPARK_BROCHOW_POOL_ID = '00000000-0000-0000-0000-000000000005';
export const AQUAPARK_BROCHOW_BASE_URL = 'https://aquapark.wroc.pl';
export const AQUAPARK_BROCHOW_SCHEDULE_URL = 'https://aquapark.wroc.pl/pl/grafik-brochow';

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
      const pdfUrl = await this.findPdfUrl();

      if (!pdfUrl) {
        console.warn('Could not find PDF URL on Brochów schedule page');
        this.lastResolvedPdfUrl = null;
        return this.getDefaultAvailability(laneIds);
      }

      this.lastResolvedPdfUrl = pdfUrl;

      const pdfBuffer = await this.downloadPdf(pdfUrl);
      const parsedSchedule = await parsePdfBuffer(pdfBuffer);

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
}

export const aquaparkWroclawBrochowScraper = new AquaparkWroclawBrochowScraper();
