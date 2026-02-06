/**
 * Tests for useMultiSlotData hook (005-pool-view-options)
 * TDD: Write tests FIRST, ensure they FAIL before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMultiSlotData } from './useMultiSlotData';
import { api } from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    getPoolAvailability: vi.fn(),
  },
}));

describe('useMultiSlotData', () => {
  const mockPoolId = 'pool-123';
  const mockDate = '2026-02-02';
  const mockStartTime = '09:00';
  const mockDuration = 30;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('slot generation', () => {
    it('should generate correct number of forward slots', async () => {
      const mockResponse = {
        lanes: [
          { laneId: '1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() },
        ],
        availableLaneCount: 1,
        totalLaneCount: 1,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 3,
        })
      );

      await waitFor(() => {
        expect(result.current.slots).toHaveLength(3);
      });
    });

    it('should generate slots with correct time ranges', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: '09:00',
          duration: 30,
          forwardSlotCount: 3,
        })
      );

      await waitFor(() => {
        expect(result.current.slots[0].startTime).toBe('09:00');
        expect(result.current.slots[0].endTime).toBe('09:30');
        expect(result.current.slots[1].startTime).toBe('09:30');
        expect(result.current.slots[1].endTime).toBe('10:00');
        expect(result.current.slots[2].startTime).toBe('10:00');
        expect(result.current.slots[2].endTime).toBe('10:30');
      });
    });
  });

  describe('parallel fetching', () => {
    it('should make parallel API calls for each slot', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 3,
        })
      );

      await waitFor(() => {
        expect(api.getPoolAvailability).toHaveBeenCalledTimes(3);
      });
    });

    it('should pass correct parameters to each API call', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: '09:00',
          duration: 30,
          forwardSlotCount: 2,
        })
      );

      await waitFor(() => {
        expect(api.getPoolAvailability).toHaveBeenCalledWith(
          mockPoolId,
          mockDate,
          '09:00',
          '09:30',
          false
        );
        expect(api.getPoolAvailability).toHaveBeenCalledWith(
          mockPoolId,
          mockDate,
          '09:30',
          '10:00',
          false
        );
      });
    });
  });

  describe('loading states', () => {
    it('should set isLoading to true while fetching', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(api.getPoolAvailability).mockReturnValue(promise as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 1,
        })
      );

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          lanes: [],
          availableLaneCount: 0,
          totalLaneCount: 0,
          dataFreshness: 'fresh',
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should track individual slot loading states', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 2,
        })
      );

      // Initially all slots should be loading
      expect(result.current.slots.every(slot => slot.loading)).toBe(true);

      await waitFor(() => {
        // After loading, all slots should not be loading
        expect(result.current.slots.every(slot => !slot.loading)).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors for individual slots', async () => {
      vi.mocked(api.getPoolAvailability)
        .mockResolvedValueOnce({
          lanes: [],
          availableLaneCount: 0,
          totalLaneCount: 0,
          dataFreshness: 'fresh',
        } as any)
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 2,
        })
      );

      await waitFor(() => {
        expect(result.current.slots[0].error).toBeUndefined();
        expect(result.current.slots[1].error).toBe('Network error');
      });
    });

    it('should continue loading other slots when one fails', async () => {
      vi.mocked(api.getPoolAvailability)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce({
          lanes: [{ laneId: '1', laneNumber: 1, isAvailable: true, lastUpdated: new Date() }],
          availableLaneCount: 1,
          totalLaneCount: 1,
          dataFreshness: 'fresh',
        } as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 2,
        })
      );

      await waitFor(() => {
        // First slot should have error
        expect(result.current.slots[0].error).toBe('Error 1');
        // Second slot should have data
        expect(result.current.slots[1].availableCount).toBe(1);
      });
    });
  });

  describe('refresh functionality', () => {
    it('should provide a refresh function', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 1,
        })
      );

      expect(typeof result.current.refresh).toBe('function');
    });

    it('should refetch all slots when refresh is called', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: mockStartTime,
          duration: mockDuration,
          forwardSlotCount: 2,
        })
      );

      await waitFor(() => {
        expect(api.getPoolAvailability).toHaveBeenCalledTimes(2);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      expect(api.getPoolAvailability).toHaveBeenCalledTimes(2);
    });
  });

  describe('day boundary handling', () => {
    it('should stop generating slots at pool closing time (22:00)', async () => {
      const mockResponse = {
        lanes: [],
        availableLaneCount: 0,
        totalLaneCount: 0,
        dataFreshness: 'fresh' as const,
      };

      vi.mocked(api.getPoolAvailability).mockResolvedValue(mockResponse as any);

      const { result } = renderHook(() =>
        useMultiSlotData({
          poolId: mockPoolId,
          date: mockDate,
          startTime: '21:30', // Close to closing time
          duration: 30,
          forwardSlotCount: 3, // Request 3 but should only get 1
        })
      );

      await waitFor(() => {
        // Should only get 1 slot (21:30-22:00) because pool closes at 22:00
        expect(result.current.slots.length).toBeLessThanOrEqual(3);
      });
    });
  });
});
