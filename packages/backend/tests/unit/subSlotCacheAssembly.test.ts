/**
 * Unit tests for sub-slot cache assembly (012-scrape-cache-prepopulate)
 *
 * Tests that the AvailabilityService can assemble cache hits from
 * pre-populated 30-minute sub-slot entries when the API request
 * uses a different (larger) time range.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('decomposeIntoSubSlots', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should decompose 60-min range into two 30-min sub-slots', async () => {
    vi.doMock('../../src/scrapers/registry.js', () => ({ scraperRegistry: { get: vi.fn() } }));
    vi.doMock('../../src/services/cache.js', () => ({ availabilityCache: { get: vi.fn(), set: vi.fn() }, poolInfoCache: { get: vi.fn(), set: vi.fn() } }));
    vi.doMock('../../src/db/queries.js', () => ({ getPoolById: vi.fn(), getLanesByPoolId: vi.fn() }));
    vi.doMock('../../src/db/schema.js', () => ({ getDatabase: vi.fn() }));

    const { decomposeIntoSubSlots } = await import('../../src/services/availability.js');
    const slots = decomposeIntoSubSlots('06:00', '07:00');
    expect(slots).toEqual([
      { startTime: '06:00', endTime: '06:30' },
      { startTime: '06:30', endTime: '07:00' },
    ]);
  });

  it('should return single slot for exact 30-min range', async () => {
    vi.doMock('../../src/scrapers/registry.js', () => ({ scraperRegistry: { get: vi.fn() } }));
    vi.doMock('../../src/services/cache.js', () => ({ availabilityCache: { get: vi.fn(), set: vi.fn() }, poolInfoCache: { get: vi.fn(), set: vi.fn() } }));
    vi.doMock('../../src/db/queries.js', () => ({ getPoolById: vi.fn(), getLanesByPoolId: vi.fn() }));
    vi.doMock('../../src/db/schema.js', () => ({ getDatabase: vi.fn() }));

    const { decomposeIntoSubSlots } = await import('../../src/services/availability.js');
    const slots = decomposeIntoSubSlots('06:00', '06:30');
    expect(slots).toEqual([
      { startTime: '06:00', endTime: '06:30' },
    ]);
  });

  it('should decompose 2-hour range into four 30-min sub-slots', async () => {
    vi.doMock('../../src/scrapers/registry.js', () => ({ scraperRegistry: { get: vi.fn() } }));
    vi.doMock('../../src/services/cache.js', () => ({ availabilityCache: { get: vi.fn(), set: vi.fn() }, poolInfoCache: { get: vi.fn(), set: vi.fn() } }));
    vi.doMock('../../src/db/queries.js', () => ({ getPoolById: vi.fn(), getLanesByPoolId: vi.fn() }));
    vi.doMock('../../src/db/schema.js', () => ({ getDatabase: vi.fn() }));

    const { decomposeIntoSubSlots } = await import('../../src/services/availability.js');
    const slots = decomposeIntoSubSlots('10:00', '12:00');
    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({ startTime: '10:00', endTime: '10:30' });
    expect(slots[3]).toEqual({ startTime: '11:30', endTime: '12:00' });
  });

  it('should handle full operating day range', async () => {
    vi.doMock('../../src/scrapers/registry.js', () => ({ scraperRegistry: { get: vi.fn() } }));
    vi.doMock('../../src/services/cache.js', () => ({ availabilityCache: { get: vi.fn(), set: vi.fn() }, poolInfoCache: { get: vi.fn(), set: vi.fn() } }));
    vi.doMock('../../src/db/queries.js', () => ({ getPoolById: vi.fn(), getLanesByPoolId: vi.fn() }));
    vi.doMock('../../src/db/schema.js', () => ({ getDatabase: vi.fn() }));

    const { decomposeIntoSubSlots } = await import('../../src/services/availability.js');
    const slots = decomposeIntoSubSlots('05:00', '22:00');
    expect(slots).toHaveLength(34);
    expect(slots[0]).toEqual({ startTime: '05:00', endTime: '05:30' });
    expect(slots[33]).toEqual({ startTime: '21:30', endTime: '22:00' });
  });

  it('should return empty array when start equals end', async () => {
    vi.doMock('../../src/scrapers/registry.js', () => ({ scraperRegistry: { get: vi.fn() } }));
    vi.doMock('../../src/services/cache.js', () => ({ availabilityCache: { get: vi.fn(), set: vi.fn() }, poolInfoCache: { get: vi.fn(), set: vi.fn() } }));
    vi.doMock('../../src/db/queries.js', () => ({ getPoolById: vi.fn(), getLanesByPoolId: vi.fn() }));
    vi.doMock('../../src/db/schema.js', () => ({ getDatabase: vi.fn() }));

    const { decomposeIntoSubSlots } = await import('../../src/services/availability.js');
    const slots = decomposeIntoSubSlots('06:00', '06:00');
    expect(slots).toEqual([]);
  });
});

describe('sub-slot cache assembly', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should serve 60-min request from two pre-populated 30-min cache entries', async () => {
    vi.setSystemTime(new Date('2026-02-11T10:00:00'));

    const scrapedAt = new Date('2026-02-11T09:00:00');
    const lane1 = { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: scrapedAt };
    const lane2 = { laneId: 'lane-2', laneNumber: 2, isAvailable: false, lastUpdated: scrapedAt };

    const cacheStore = new Map<string, { value: unknown; expiresAt: Date; createdAt: Date }>();
    cacheStore.set('availability:test-pool:2026-02-11:10:00:10:30', {
      value: { lanes: [lane1, lane2], scrapedAt },
      expiresAt: new Date('2026-02-11T12:00:00'),
      createdAt: scrapedAt,
    });
    cacheStore.set('availability:test-pool:2026-02-11:10:30:11:00', {
      value: { lanes: [lane1, lane2], scrapedAt },
      expiresAt: new Date('2026-02-11T12:00:00'),
      createdAt: scrapedAt,
    });

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn((key: string) => cacheStore.get(key) ?? null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockRejectedValue(new Error('Should not be called')),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/db/queries.js', () => ({
      getPoolById: vi.fn().mockReturnValue({ id: 'test-pool', name: 'Test Pool' }),
      getLanesByPoolId: vi.fn().mockReturnValue([]),
    }));

    vi.doMock('../../src/db/schema.js', () => ({
      getDatabase: vi.fn().mockReturnValue({
        exec: vi.fn().mockReturnValue([]),
      }),
    }));

    const { AvailabilityService } = await import('../../src/services/availability.js');
    const service = new AvailabilityService();

    const result = await service.getAvailability(
      'test-pool',
      new Date('2026-02-11'),
      { startTime: '10:00', endTime: '11:00' }
    );

    expect(result.dataFreshness).toBe('cached');
    expect(result.lanes).toHaveLength(2);
  });

  it('should mark lane as unavailable if unavailable in any sub-slot', async () => {
    vi.setSystemTime(new Date('2026-02-11T10:00:00'));

    const scrapedAt = new Date('2026-02-11T09:00:00');
    const laneAvailableSlot1 = { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: scrapedAt };
    const laneUnavailableSlot2 = { laneId: 'lane-1', laneNumber: 1, isAvailable: false, lastUpdated: scrapedAt };

    const cacheStore = new Map<string, { value: unknown; expiresAt: Date; createdAt: Date }>();
    cacheStore.set('availability:test-pool:2026-02-11:10:00:10:30', {
      value: { lanes: [laneAvailableSlot1], scrapedAt },
      expiresAt: new Date('2026-02-11T12:00:00'),
      createdAt: scrapedAt,
    });
    cacheStore.set('availability:test-pool:2026-02-11:10:30:11:00', {
      value: { lanes: [laneUnavailableSlot2], scrapedAt },
      expiresAt: new Date('2026-02-11T12:00:00'),
      createdAt: scrapedAt,
    });

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn((key: string) => cacheStore.get(key) ?? null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

    vi.doMock('../../src/scrapers/registry.js', () => ({
      scraperRegistry: {
        get: vi.fn().mockReturnValue({
          poolId: 'test-pool',
          name: 'test-scraper',
          fetchAvailability: vi.fn().mockRejectedValue(new Error('Should not be called')),
        }),
        getAll: vi.fn().mockReturnValue([]),
      },
    }));

    vi.doMock('../../src/db/queries.js', () => ({
      getPoolById: vi.fn().mockReturnValue({ id: 'test-pool', name: 'Test Pool' }),
      getLanesByPoolId: vi.fn().mockReturnValue([]),
    }));

    vi.doMock('../../src/db/schema.js', () => ({
      getDatabase: vi.fn().mockReturnValue({
        exec: vi.fn().mockReturnValue([]),
      }),
    }));

    const { AvailabilityService } = await import('../../src/services/availability.js');
    const service = new AvailabilityService();

    const result = await service.getAvailability(
      'test-pool',
      new Date('2026-02-11'),
      { startTime: '10:00', endTime: '11:00' }
    );

    expect(result.dataFreshness).toBe('cached');
    expect(result.lanes).toHaveLength(1);
    expect(result.lanes[0].isAvailable).toBe(false);
  });

  it('should fall through to scrape if any sub-slot is missing from cache', async () => {
    vi.setSystemTime(new Date('2026-02-11T10:00:00'));

    const scrapedAt = new Date('2026-02-11T09:00:00');
    const lane1 = { laneId: 'lane-1', laneNumber: 1, isAvailable: true, lastUpdated: scrapedAt };

    const cacheStore = new Map<string, { value: unknown; expiresAt: Date; createdAt: Date }>();
    cacheStore.set('availability:test-pool:2026-02-11:10:00:10:30', {
      value: { lanes: [lane1], scrapedAt },
      expiresAt: new Date('2026-02-11T12:00:00'),
      createdAt: scrapedAt,
    });

    const fetchMock = vi.fn().mockResolvedValue([lane1]);

    vi.doMock('../../src/services/cache.js', () => ({
      availabilityCache: {
        get: vi.fn((key: string) => cacheStore.get(key) ?? null),
        set: vi.fn(),
      },
      poolInfoCache: { get: vi.fn(), set: vi.fn() },
    }));

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

    vi.doMock('../../src/db/queries.js', () => ({
      getPoolById: vi.fn().mockReturnValue({ id: 'test-pool', name: 'Test Pool' }),
      getLanesByPoolId: vi.fn().mockReturnValue([]),
    }));

    vi.doMock('../../src/db/schema.js', () => ({
      getDatabase: vi.fn().mockReturnValue({
        exec: vi.fn().mockReturnValue([]),
      }),
    }));

    const { AvailabilityService } = await import('../../src/services/availability.js');
    const service = new AvailabilityService();

    const result = await service.getAvailability(
      'test-pool',
      new Date('2026-02-11'),
      { startTime: '10:00', endTime: '11:00' }
    );

    expect(result.dataFreshness).toBe('fresh');
    expect(fetchMock).toHaveBeenCalled();
  });
});
