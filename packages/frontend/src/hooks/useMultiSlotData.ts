/**
 * useMultiSlotData - Hook for fetching and managing multi-slot availability data
 * 005-pool-view-options
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { generateForwardSlots } from '../utils/timeSlotUtils';
import type { SlotData } from '../components/SlotSection';
import type { LaneAvailability } from '@swim-check/shared';

export interface UseMultiSlotDataProps {
  poolId: string;
  date: string;
  startTime: string;
  duration: number;
  forwardSlotCount: number;
}

export interface UseMultiSlotDataReturn {
  /** Array of slot data */
  slots: SlotData[];
  /** Whether any slot is currently loading */
  isLoading: boolean;
  /** Refresh all slots */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching availability data for multiple consecutive time slots
 * Makes parallel API calls for each slot with individual loading/error states
 */
export function useMultiSlotData({
  poolId,
  date,
  startTime,
  duration,
  forwardSlotCount,
}: UseMultiSlotDataProps): UseMultiSlotDataReturn {
  // Generate slot time ranges
  const forwardSlots = generateForwardSlots(startTime, duration, forwardSlotCount);

  // Initialize slots with loading state
  const initialSlots: SlotData[] = forwardSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    lanes: [],
    availableCount: 0,
    totalCount: 0,
    loading: true,
    dataFreshness: undefined,
    error: undefined,
  }));

  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch availability for a single slot
  const fetchSlot = useCallback(
    async (slotIndex: number, slotStartTime: string, slotEndTime: string): Promise<void> => {
      try {
        const result = await api.getPoolAvailability(
          poolId,
          date,
          slotStartTime,
          slotEndTime,
          false
        );

        setSlots((prev) => {
          const updated = [...prev];
          if (updated[slotIndex]) {
            updated[slotIndex] = {
              ...updated[slotIndex],
              lanes: result.lanes,
              availableCount: result.availableLaneCount,
              totalCount: result.totalLaneCount,
              dataFreshness: result.dataFreshness,
              loading: false,
              error: undefined,
            };
          }
          return updated;
        });
      } catch (err) {
        setSlots((prev) => {
          const updated = [...prev];
          if (updated[slotIndex]) {
            updated[slotIndex] = {
              ...updated[slotIndex],
              loading: false,
              error: (err as Error).message,
            };
          }
          return updated;
        });
      }
    },
    [poolId, date]
  );

  // Fetch all slots in parallel
  const fetchAllSlots = useCallback(async () => {
    // Reset slots to loading state
    setSlots(forwardSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      lanes: [],
      availableCount: 0,
      totalCount: 0,
      loading: true,
      dataFreshness: undefined,
      error: undefined,
    })));
    setIsLoading(true);

    // Make parallel API calls
    const promises = forwardSlots.map((slot, index) =>
      fetchSlot(index, slot.startTime, slot.endTime)
    );

    await Promise.all(promises);
    setIsLoading(false);
  }, [forwardSlots, fetchSlot]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (poolId && date && startTime && forwardSlotCount > 0) {
      fetchAllSlots();
    }
  }, [poolId, date, startTime, duration, forwardSlotCount]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchAllSlots();
  }, [fetchAllSlots]);

  return {
    slots,
    isLoading,
    refresh,
  };
}
