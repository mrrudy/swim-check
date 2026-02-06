/**
 * useCombinedFavoritesData - Hook for fetching and managing combined favorites availability data
 * 007-favorites-combined-view
 *
 * T004: Hook skeleton
 * T005: Favorites list fetching
 * T006: Parallel availability fetching
 * T007: Slot data organization
 * T008: Refresh function and loading state
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { generateForwardSlots } from '../utils/timeSlotUtils';
import type { FavoritePoolResponse } from '@swim-check/shared';
import type {
  CombinedFavoritesState,
  CombinedSlotData,
  FavoritePoolSlotData,
  DataFreshness,
} from '../types/views';

export interface UseCombinedFavoritesDataProps {
  /** Selected date in YYYY-MM-DD format */
  date: string;
  /** Start time in HH:MM format */
  startTime: string;
  /** Duration in minutes */
  duration: number;
  /** Number of forward slots to display (1-10) */
  forwardSlotCount: number;
}

/**
 * Hook for fetching availability data for all favorites across multiple time slots.
 * Makes parallel API calls for each favorite pool per time slot.
 */
export function useCombinedFavoritesData({
  date,
  startTime,
  duration,
  forwardSlotCount,
}: UseCombinedFavoritesDataProps): CombinedFavoritesState {
  // T005: Favorites list state
  const [favorites, setFavorites] = useState<FavoritePoolResponse[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | undefined>();

  // T006/T007: Slots availability state
  const [slots, setSlots] = useState<CombinedSlotData[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // T005: Fetch favorites list
  const fetchFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    setFavoritesError(undefined);

    try {
      const response = await api.listFavorites();
      setFavorites(response.favorites);
    } catch (error) {
      setFavoritesError((error as Error).message || 'Failed to load favorites');
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  // T006/T007: Fetch availability for all favorites across all slots
  const fetchAvailability = useCallback(async () => {
    if (favorites.length === 0) {
      setSlots([]);
      return;
    }

    setIsLoadingAvailability(true);

    // Generate time slots
    const timeSlots = generateForwardSlots(startTime, duration, forwardSlotCount);

    // T007: Initialize slots with loading state
    const initialSlots: CombinedSlotData[] = timeSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      header: `${slot.startTime} - ${slot.endTime}`,
      favorites: favorites.map((fav) => ({
        pool: fav.pool,
        displayOrder: fav.displayOrder,
        lanes: [],
        availableCount: 0,
        totalCount: fav.pool.totalLanes,
        dataFreshness: 'unavailable' as DataFreshness,
        status: 'loading' as const,
      })),
      isLoading: true,
      allFailed: false,
    }));
    setSlots(initialSlots);

    // T006: Parallel fetch for all favorites across all slots
    const requests = favorites.flatMap((favorite, favIndex) =>
      timeSlots.map(async (slot, slotIndex) => {
        try {
          const data = await api.getPoolAvailability(
            favorite.pool.id,
            date,
            slot.startTime,
            slot.endTime,
            false
          );
          return {
            favIndex,
            slotIndex,
            poolId: favorite.pool.id,
            data,
            error: null,
          };
        } catch (error) {
          return {
            favIndex,
            slotIndex,
            poolId: favorite.pool.id,
            data: null,
            error: (error as Error).message || 'Failed to fetch availability',
          };
        }
      })
    );

    const results = await Promise.all(requests);

    // T007: Update slots with results
    setSlots((currentSlots) => {
      const updatedSlots = currentSlots.map((slot) => ({
        ...slot,
        favorites: slot.favorites.map((fav) => ({ ...fav })),
      }));

      for (const result of results) {
        const slot = updatedSlots[result.slotIndex];
        if (!slot) continue;

        const favIndex = slot.favorites.findIndex(
          (f) => f.pool.id === result.poolId
        );
        if (favIndex < 0) continue;

        if (result.data) {
          slot.favorites[favIndex] = {
            ...slot.favorites[favIndex],
            lanes: result.data.lanes,
            availableCount: result.data.availableLaneCount,
            totalCount: result.data.totalLaneCount,
            dataFreshness: result.data.dataFreshness,
            status: 'loaded',
            error: undefined,
          };
        } else {
          slot.favorites[favIndex] = {
            ...slot.favorites[favIndex],
            status: 'error',
            error: result.error ?? 'Unknown error',
          };
        }
      }

      // Update slot-level states
      for (const slot of updatedSlots) {
        slot.isLoading = slot.favorites.some((f) => f.status === 'loading');
        slot.allFailed = slot.favorites.every(
          (f) => f.status === 'error' || f.status === 'unavailable'
        );
      }

      return updatedSlots;
    });

    setIsLoadingAvailability(false);
  }, [favorites, date, startTime, duration, forwardSlotCount]);

  // Initial fetch of favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch availability when favorites or time params change
  useEffect(() => {
    if (!isLoadingFavorites && favorites.length > 0) {
      fetchAvailability();
    } else if (!isLoadingFavorites && favorites.length === 0) {
      setSlots([]);
    }
  }, [isLoadingFavorites, favorites, date, startTime, duration, forwardSlotCount, fetchAvailability]);

  // T008: Refresh function
  const refresh = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    slots,
    isLoadingFavorites,
    isLoadingAvailability,
    isEmpty: !isLoadingFavorites && favorites.length === 0,
    favoritesError,
    refresh,
  };
}
