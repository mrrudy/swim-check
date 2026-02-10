import { describe, it, expect, vi, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { TimeSlot } from '@swim-check/shared';

// Mock fetch before importing the scraper
const fixtureHtml = readFileSync(
  resolve(import.meta.dirname, 'fixtures', 'basen1-schedule.html'),
  'utf-8'
);

vi.stubGlobal(
  'fetch',
  vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    // The scraper GETs the full booking page; return fixture HTML for any fetch
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(fixtureHtml),
    });
  })
);

// Mock getLanesByPoolId to return test lanes
vi.mock('../../../src/db/queries.js', () => ({
  getLanesByPoolId: (poolId: string) => {
    if (poolId === '00000000-0000-0000-0000-000000000004') {
      return Array.from({ length: 5 }, (_, i) => ({
        id: `lane-${i + 1}`,
        poolId,
        laneNumber: i + 1,
        label: null,
      }));
    }
    return [];
  },
  getPoolById: () => null,
  createLanesForPool: () => {},
}));

const { TeatralnaBasen1Scraper } = await import(
  '../../../src/scrapers/pools/teatralna-basen1/index.js'
);

describe('TeatralnaBasen1Scraper', () => {
  let scraper: InstanceType<typeof TeatralnaBasen1Scraper>;

  beforeAll(() => {
    scraper = new TeatralnaBasen1Scraper();
  });

  describe('metadata', () => {
    it('should have correct poolId', () => {
      expect(scraper.poolId).toBe('00000000-0000-0000-0000-000000000004');
    });

    it('should have correct name', () => {
      expect(scraper.name).toBe('teatralna-basen1');
    });

    it('should have version 1.0.0', () => {
      expect(scraper.version).toBe('1.0.0');
    });

    it('should have scrapeIntervalHours set to 3', () => {
      expect(scraper.scrapeIntervalHours).toBe(3);
    });
  });

  describe('fetchAvailability', () => {
    it('should return LaneAvailability[] for a valid date', async () => {
      const date = new Date('2026-02-10');
      const timeSlot: TimeSlot = { startTime: '06:00', endTime: '22:00' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      expect(availability).toBeDefined();
      expect(Array.isArray(availability)).toBe(true);
      expect(availability.length).toBeGreaterThan(0);
    });

    it('should return entries with correct LaneAvailability shape', async () => {
      const date = new Date('2026-02-10');
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '10:00' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      for (const lane of availability) {
        expect(lane).toHaveProperty('laneId');
        expect(lane).toHaveProperty('laneNumber');
        expect(lane).toHaveProperty('isAvailable');
        expect(lane).toHaveProperty('lastUpdated');
        expect(typeof lane.isAvailable).toBe('boolean');
      }
    });

    it('should deduplicate lanes across half-hour sub-slots within an hour', async () => {
      const date = new Date('2026-02-10');
      // Request a single hour — both :00 and :30 sub-slots come from the same hourly source
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '10:00' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      // With 5 lanes, we expect exactly 5 entries (one per lane, deduplicated)
      expect(availability.length).toBe(5);
    });

    it('should show 5 available lanes when 30 spots are free (full availability)', async () => {
      const date = new Date('2026-02-10');
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '09:30' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      expect(availability).toHaveLength(5);
      const availableLanes = availability.filter((a) => a.isAvailable);
      expect(availableLanes).toHaveLength(5);
    });

    it('should show 4 available lanes when 27 spots are free', async () => {
      // Tuesday 07:00 has 27 free spots → 27/6 = 4.5 → floor = 4 lanes
      const date = new Date('2026-02-10');
      const timeSlot: TimeSlot = { startTime: '07:00', endTime: '07:30' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      expect(availability).toHaveLength(5);
      const availableLanes = availability.filter((a) => a.isAvailable);
      expect(availableLanes).toHaveLength(4);
    });

    it('should show 2 available lanes when 12 spots are free', async () => {
      // Friday 15:00 has 12 free spots → 12/6 = 2 lanes
      const date = new Date('2026-02-13');
      const timeSlot: TimeSlot = { startTime: '15:00', endTime: '15:30' };

      const availability = await scraper.fetchAvailability(date, timeSlot);

      expect(availability).toHaveLength(5);
      const availableLanes = availability.filter((a) => a.isAvailable);
      expect(availableLanes).toHaveLength(2);
    });

    it('should return empty array for a date not in the schedule', async () => {
      const date = new Date('2026-03-01'); // Not in the week
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '10:00' };

      const availability = await scraper.fetchAvailability(date, timeSlot);
      expect(availability).toHaveLength(0);
    });

    it('should GET the full booking page with date parameter', async () => {
      const date = new Date('2026-02-10');
      const timeSlot: TimeSlot = { startTime: '09:00', endTime: '10:00' };

      const mockFetch = fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockClear();

      await scraper.fetchAvailability(date, timeSlot);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain('index.php?s=basen_1');
      expect(url).toContain('date=2026-02-10');
      expect(init?.method).toBeUndefined();
    });
  });

  describe('isHealthy', () => {
    it('should return true when fetch succeeds with 200', async () => {
      const healthy = await scraper.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('getResolvedSourceUrls', () => {
    it('should return the static booking page URL', () => {
      const urls = scraper.getResolvedSourceUrls();
      expect(urls).toBeDefined();
      expect(urls).toHaveLength(1);
      expect(urls![0].url).toContain('klient.spa.wroc.pl');
      expect(urls![0].label).toBe('Booking Page');
    });
  });
});
