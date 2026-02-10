import { describe, it, expect } from 'vitest';
import { spotsToLanes, calculateTotalLanes } from '../../../src/scrapers/pools/teatralna-basen1/parser.js';

describe('spotsToLanes', () => {
  const SPOTS_PER_LANE = 6;

  it('should convert 30 spots to 5 lanes', () => {
    expect(spotsToLanes(30, SPOTS_PER_LANE)).toBe(5);
  });

  it('should convert 12 spots to 2 lanes', () => {
    expect(spotsToLanes(12, SPOTS_PER_LANE)).toBe(2);
  });

  it('should convert 7 spots to 1 lane (partial lane not counted)', () => {
    expect(spotsToLanes(7, SPOTS_PER_LANE)).toBe(1);
  });

  it('should convert 0 spots to 0 lanes', () => {
    expect(spotsToLanes(0, SPOTS_PER_LANE)).toBe(0);
  });

  it('should convert 5 spots to 0 lanes (less than one full lane)', () => {
    expect(spotsToLanes(5, SPOTS_PER_LANE)).toBe(0);
  });

  it('should convert 18 spots to 3 lanes', () => {
    expect(spotsToLanes(18, SPOTS_PER_LANE)).toBe(3);
  });

  it('should convert 24 spots to 4 lanes', () => {
    expect(spotsToLanes(24, SPOTS_PER_LANE)).toBe(4);
  });

  it('should convert 29 spots to 4 lanes (partial not counted)', () => {
    expect(spotsToLanes(29, SPOTS_PER_LANE)).toBe(4);
  });
});

describe('calculateTotalLanes', () => {
  const SPOTS_PER_LANE = 6;
  const CONFIGURED_MAX_SPOTS = 30;

  it('should calculate 5 total lanes from 30 max spots', () => {
    expect(calculateTotalLanes(30, SPOTS_PER_LANE, CONFIGURED_MAX_SPOTS)).toBe(5);
  });

  it('should calculate 2 total lanes from 12 max spots (reduced capacity)', () => {
    expect(calculateTotalLanes(12, SPOTS_PER_LANE, CONFIGURED_MAX_SPOTS)).toBe(2);
  });

  it('should cap at configured max when max spots exceed config (35 spots → 5 lanes)', () => {
    expect(calculateTotalLanes(35, SPOTS_PER_LANE, CONFIGURED_MAX_SPOTS)).toBe(5);
  });

  it('should return 0 total lanes when max spots is 0', () => {
    expect(calculateTotalLanes(0, SPOTS_PER_LANE, CONFIGURED_MAX_SPOTS)).toBe(0);
  });

  it('should handle partial lanes in max spots', () => {
    expect(calculateTotalLanes(15, SPOTS_PER_LANE, CONFIGURED_MAX_SPOTS)).toBe(2);
  });
});
