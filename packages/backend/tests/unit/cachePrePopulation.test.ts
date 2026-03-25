/**
 * Unit tests for cache pre-population (012-scrape-cache-prepopulate)
 *
 * T006: generateFutureSlots() unit tests
 * T007: prepopulateCacheForPool() unit tests
 * T012: TTL alignment unit tests
 * T013: TTL edge cases unit tests
 * T018: Partial scrape data edge case
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('generateFutureSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate slots from current time rounded up to 22:00', async () => {
    vi.setSystemTime(new Date('2026-02-11T14:15:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toEqual({ startTime: '14:30', endTime: '15:00' });
    expect(slots[slots.length - 1]).toEqual({ startTime: '21:30', endTime: '22:00' });
  });

  it('should generate slots starting exactly on 30-min boundary', async () => {
    vi.setSystemTime(new Date('2026-02-11T10:00:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots[0]).toEqual({ startTime: '10:00', endTime: '10:30' });
  });

  it('should clamp to first slot when before operating hours', async () => {
    vi.setSystemTime(new Date('2026-02-11T03:00:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots[0]).toEqual({ startTime: '05:00', endTime: '05:30' });
    expect(slots.length).toBe(34);
  });

  it('should return empty array when at or after closing time', async () => {
    vi.setSystemTime(new Date('2026-02-11T22:00:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots.length).toBe(0);
  });

  it('should return empty array when after closing time', async () => {
    vi.setSystemTime(new Date('2026-02-11T23:00:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots.length).toBe(0);
  });

  it('should generate only one slot near closing time', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:30:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    expect(slots.length).toBe(1);
    expect(slots[0]).toEqual({ startTime: '21:30', endTime: '22:00' });
  });

  it('should produce 30-minute slot durations', async () => {
    vi.setSystemTime(new Date('2026-02-11T12:00:00'));

    const { generateFutureSlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateFutureSlots(new Date());

    for (const slot of slots) {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm);
      expect(durationMins).toBe(30);
    }
  });
});

/**
 * Common mock setup for prepopulateCacheForPool tests.
 * Mocks the DB queries module to avoid database initialization requirement.
 */
function mockDbQueries() {
  vi.doMock('../../src/db/queries.js', () => ({
    getPoolById: vi.fn().mockReturnValue({ id: 'test-pool', name: 'Test Pool' }),
    getLanesByPoolId: vi.fn().mockReturnValue([]),
    getOrCreatePreferences: vi.fn().mockReturnValue({ slotDurationMins: 60 }),
  }));
}

describe('prepopulateCacheForPool', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call fetchAvailability for each future slot and cache results', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:00:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockResolvedValue([
            { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
          ]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        has: vi.fn().mockReturnValue(false),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    // At 21:00, should have 2 slots: 21:00-21:30, 21:30-22:00
    await prepopulateCacheForPool('test-pool', '2026-02-11');

    expect(availabilityCache.set).toHaveBeenCalledTimes(2);

    const firstCall = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(firstCall[0]).toBe('availability:test-pool:2026-02-11:21:00:21:30');
    expect(firstCall[1]).toHaveProperty('lanes');
    expect(firstCall[1]).toHaveProperty('scrapedAt');
  });

  it('should skip pre-population when no future slots exist', async () => {
    vi.setSystemTime(new Date('2026-02-11T22:00:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn(),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn(),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    expect(availabilityCache.set).not.toHaveBeenCalled();
  });

  it('should handle partial scrape data gracefully (T018)', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:00:00'));

    mockDbQueries();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce([
        { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
      ])
      .mockResolvedValueOnce([]);

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: fetchMock,
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    // Both slots cached (one with data, one empty)
    expect(availabilityCache.set).toHaveBeenCalledTimes(2);
  });
});

describe('generateAllDaySlots', () => {
  it('should generate all slots from 05:00 to 22:00', async () => {
    const { generateAllDaySlots } = await import('../../src/services/scrapeOrchestrator.js');
    const slots = generateAllDaySlots();

    expect(slots.length).toBe(34);
    expect(slots[0]).toEqual({ startTime: '05:00', endTime: '05:30' });
    expect(slots[slots.length - 1]).toEqual({ startTime: '21:30', endTime: '22:00' });
  });
});

describe('multi-day pre-population', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should pre-populate today (future slots only) and future dates (all-day slots)', async () => {
    // Wednesday at 21:00 → 2 remaining slots today, 34 slots per future day
    vi.setSystemTime(new Date('2026-02-11T21:00:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockResolvedValue([
            { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
          ]),
          // Wed-Sun: today (2026-02-11) + 4 future days
          getAvailableDates: vi.fn().mockReturnValue([
            '2026-02-11', '2026-02-12', '2026-02-13', '2026-02-14', '2026-02-15',
          ]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        has: vi.fn().mockReturnValue(false),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    // 2 today slots + 4 future days × 34 slots each = 2 + 136 = 138
    expect(availabilityCache.set).toHaveBeenCalledTimes(138);

    // Verify today's slots use the date 2026-02-11
    const firstCall = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(firstCall[0]).toBe('availability:test-pool:2026-02-11:21:00:21:30');

    // Verify future date slots start at 05:00
    const thirdCall = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[2];
    expect(thirdCall[0]).toBe('availability:test-pool:2026-02-12:05:00:05:30');
  });

  it('should skip past dates from getAvailableDates', async () => {
    vi.setSystemTime(new Date('2026-02-13T10:00:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockResolvedValue([]),
          // Mon-Sun week, but today is Friday → Mon/Tue/Wed/Thu are past
          getAvailableDates: vi.fn().mockReturnValue([
            '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12',
            '2026-02-13', '2026-02-14', '2026-02-15',
          ]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-13');

    // Today at 10:00 → 24 remaining slots today + 2 future days × 34 = 24 + 68 = 92
    expect(availabilityCache.set).toHaveBeenCalledTimes(92);

    // Verify no calls for past dates
    const allCacheKeys = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0] as string
    );
    expect(allCacheKeys.every((k: string) => !k.includes('2026-02-09') && !k.includes('2026-02-10'))).toBe(true);
  });

  it('should fall back to todayStr when getAvailableDates is not implemented', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:00:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockResolvedValue([]),
          // No getAvailableDates method
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: () => 10800,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    // Only 2 today slots (21:00-21:30 and 21:30-22:00)
    expect(availabilityCache.set).toHaveBeenCalledTimes(2);
  });
});

describe('TTL alignment (US2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use scrapeIntervalHours * 3600 as TTL (T012)', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:30:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          scrapeIntervalHours: 3,
          fetchAvailability: vi.fn().mockResolvedValue([]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: (scraper: { scrapeIntervalHours?: number }) =>
        scraper?.scrapeIntervalHours ? scraper.scrapeIntervalHours * 3600 : 86400,
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    const call = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[2]).toBe(10800);
  });

  it('should use cacheTtlSeconds when explicitly set (T013)', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:30:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          cacheTtlSeconds: 7200,
          scrapeIntervalHours: 3,
          fetchAvailability: vi.fn().mockResolvedValue([]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: (scraper: { cacheTtlSeconds?: number; scrapeIntervalHours?: number }) =>
        scraper?.cacheTtlSeconds ?? (scraper?.scrapeIntervalHours ? scraper.scrapeIntervalHours * 3600 : 86400),
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    const call = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[2]).toBe(7200);
  });

  it('should use 24h TTL for midnight-only pools (T013)', async () => {
    vi.setSystemTime(new Date('2026-02-11T21:30:00'));

    mockDbQueries();

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockResolvedValue([]),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/services/availability.js', () => ({
      getCacheKey: (poolId: string, date: string, start: string, end: string) =>
        `availability:${poolId}:${date}:${start}:${end}`,
      getPoolCacheTtl: (scraper: { cacheTtlSeconds?: number; scrapeIntervalHours?: number }) => {
        if (!scraper) return 86400;
        return scraper.cacheTtlSeconds ?? (scraper.scrapeIntervalHours ? scraper.scrapeIntervalHours * 3600 : 86400);
      },
    }));

    const { prepopulateCacheForPool } = await import('../../src/services/scrapeOrchestrator.js');
    const { availabilityCache } = await import('../../src/services/cache.js');

    await prepopulateCacheForPool('test-pool', '2026-02-11');

    const call = (availabilityCache.set as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[2]).toBe(86400);
  });
});

