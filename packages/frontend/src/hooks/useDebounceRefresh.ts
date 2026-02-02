/**
 * useDebounceRefresh - Debounced auto-refresh hook for time slot changes
 * Triggers refresh after 2 seconds of no state changes
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimeSlotState } from './useTimeSlotState';

/**
 * Props for the debounced auto-refresh hook.
 */
export interface UseDebounceRefreshProps {
  /** Current time slot state to watch for changes */
  timeSlotState: TimeSlotState;

  /** Refresh function to call after debounce */
  onRefresh: () => Promise<void>;

  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;

  /** Whether state has been initialized (skip debounce for initial load) */
  isInitialized: boolean;
}

/**
 * Return type for the debounce refresh hook.
 */
export interface UseDebounceRefreshReturn {
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;

  /** Cancel any pending debounced refresh */
  cancelPending: () => void;

  /** Force an immediate refresh (bypass debounce) */
  refreshNow: () => void;
}

/**
 * Hook for debounced auto-refresh when time slot state changes.
 *
 * Features:
 * - 2-second debounce (configurable via delay prop)
 * - Timer resets when state changes before timer elapses
 * - Immediate refresh on initial page load (bypasses debounce)
 * - Cancel pending refresh capability
 * - Force immediate refresh capability
 */
export function useDebounceRefresh({
  timeSlotState,
  onRefresh,
  delay = 2000,
  isInitialized,
}: UseDebounceRefreshProps): UseDebounceRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialRefreshRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep onRefresh ref updated to avoid stale closures
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Cancel any pending timer
  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Execute refresh
  const executeRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Force immediate refresh
  const refreshNow = useCallback(() => {
    cancelPending();
    executeRefresh();
  }, [cancelPending, executeRefresh]);

  // Handle initial page load - immediate refresh (FR-010)
  useEffect(() => {
    if (isInitialized && !hasInitialRefreshRef.current) {
      hasInitialRefreshRef.current = true;
      executeRefresh();
    }
  }, [isInitialized, executeRefresh]);

  // Watch for state changes and debounce refresh
  useEffect(() => {
    // Skip if not initialized or if this is the initial load
    if (!isInitialized || !hasInitialRefreshRef.current) {
      return;
    }

    // Cancel any existing timer
    cancelPending();

    // Start new debounce timer
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      executeRefresh();
    }, delay);

    // Cleanup on unmount or when dependencies change
    return () => {
      cancelPending();
    };
  }, [
    timeSlotState.date,
    timeSlotState.startTime,
    timeSlotState.endTime,
    delay,
    isInitialized,
    cancelPending,
    executeRefresh,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPending();
    };
  }, [cancelPending]);

  return {
    isRefreshing,
    cancelPending,
    refreshNow,
  };
}
