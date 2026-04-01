/**
 * useViewPreferences - Hook for managing view preferences state with API persistence
 * 005-pool-view-options
 *
 * Phase 3 (T010): Initial skeleton with compactViewEnabled state only
 * Phase 4 (T019): Extended with forwardSlotCount state
 * Phase 5 (T024): Complete with API persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';

/** Default values per FR-009 */
const DEFAULTS = {
  compactViewEnabled: true,
  forwardSlotCount: 1,
  showNavEnabled: true,
  slotDurationMins: 60,
};

/** Debounce delay for saving preferences (T032) */
const SAVE_DEBOUNCE_MS = 300;

export interface UseViewPreferencesReturn {
  /** Current preferences state */
  compactViewEnabled: boolean;
  forwardSlotCount: number;
  showNavEnabled: boolean;
  slotDurationMins: number;

  /** Loading states */
  isLoading: boolean;
  isSaving: boolean;

  /** Error state */
  error: string | null;

  /** Actions */
  setCompactViewEnabled: (enabled: boolean) => void;
  setForwardSlotCount: (count: number) => void;
  setShowNavEnabled: (enabled: boolean) => void;
}

/**
 * Hook for managing view preferences with API persistence
 * Loads preferences on mount, saves on change with optimistic updates
 */
export function useViewPreferences(): UseViewPreferencesReturn {
  const [compactViewEnabled, setCompactViewEnabledState] = useState(DEFAULTS.compactViewEnabled);
  const [forwardSlotCount, setForwardSlotCountState] = useState(DEFAULTS.forwardSlotCount);
  const [showNavEnabled, setShowNavEnabledState] = useState(DEFAULTS.showNavEnabled);
  const [slotDurationMins, setSlotDurationMinsState] = useState(DEFAULTS.slotDurationMins);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // T032: Debounce timers for rapid toggle
  const saveCompactTimerRef = useRef<number | null>(null);
  const saveSlotCountTimerRef = useRef<number | null>(null);
  const saveShowNavTimerRef = useRef<number | null>(null);

  // Load preferences from API on mount
  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const prefs = await api.getPreferences();
        if (mounted) {
          setCompactViewEnabledState(prefs.compactViewEnabled);
          setForwardSlotCountState(prefs.forwardSlotCount);
          setShowNavEnabledState(prefs.showNavEnabled);
          setSlotDurationMinsState(prefs.slotDurationMins);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  // Save compactViewEnabled with optimistic update and debouncing (T032)
  const setCompactViewEnabled = useCallback((enabled: boolean) => {
    // Optimistic update - update local state immediately
    setCompactViewEnabledState(enabled);
    setError(null);

    // Clear any pending save
    if (saveCompactTimerRef.current) {
      clearTimeout(saveCompactTimerRef.current);
    }

    setIsSaving(true);

    // Debounce the API call
    saveCompactTimerRef.current = window.setTimeout(() => {
      api.updatePreferences({ compactViewEnabled: enabled })
        .catch((err) => {
          setError((err as Error).message);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Save forwardSlotCount with optimistic update and debouncing (T032)
  const setForwardSlotCount = useCallback((count: number) => {
    // Clamp to valid range (1-10)
    const clampedCount = Math.max(1, Math.min(10, count));

    // Optimistic update - update local state immediately
    setForwardSlotCountState(clampedCount);
    setError(null);

    // Clear any pending save
    if (saveSlotCountTimerRef.current) {
      clearTimeout(saveSlotCountTimerRef.current);
    }

    setIsSaving(true);

    // Debounce the API call
    saveSlotCountTimerRef.current = window.setTimeout(() => {
      api.updatePreferences({ forwardSlotCount: clampedCount })
        .catch((err) => {
          setError((err as Error).message);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Save showNavEnabled with optimistic update and debouncing (009-mobile-ui-refinements)
  const setShowNavEnabled = useCallback((enabled: boolean) => {
    setShowNavEnabledState(enabled);
    setError(null);

    if (saveShowNavTimerRef.current) {
      clearTimeout(saveShowNavTimerRef.current);
    }

    setIsSaving(true);

    saveShowNavTimerRef.current = window.setTimeout(() => {
      api.updatePreferences({ showNavEnabled: enabled })
        .catch((err) => {
          setError((err as Error).message);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveCompactTimerRef.current) clearTimeout(saveCompactTimerRef.current);
      if (saveSlotCountTimerRef.current) clearTimeout(saveSlotCountTimerRef.current);
      if (saveShowNavTimerRef.current) clearTimeout(saveShowNavTimerRef.current);
    };
  }, []);

  return {
    compactViewEnabled,
    forwardSlotCount,
    showNavEnabled,
    slotDurationMins,
    isLoading,
    isSaving,
    error,
    setCompactViewEnabled,
    setForwardSlotCount,
    setShowNavEnabled,
  };
}
