# Quickstart: Favorites Combined Availability View

**Feature**: 007-favorites-combined-view
**Date**: 2026-02-06

## Overview

This guide provides the minimal implementation steps to add the combined favorites availability view to the Home page.

---

## Prerequisites

- Existing favorites functionality works (add/remove/reorder)
- View preferences (compact toggle, slots ahead) work on pool detail page
- Development environment running (`npm run dev`)

---

## Step 1: Add New Types

**File**: `packages/frontend/src/types/views.ts`

Add these types at the end of the file:

```typescript
/**
 * Availability data for a single favorite pool within a time slot.
 */
export interface FavoritePoolSlotData {
  pool: SwimmingPool;
  displayOrder: number;
  lanes: LaneAvailability[];
  availableCount: number;
  totalCount: number;
  dataFreshness: DataFreshness;
  status: SlotStatus;
  error?: string;
}

/**
 * A time slot section showing all favorite pools' availability.
 */
export interface CombinedSlotData {
  startTime: string;
  endTime: string;
  header: string;
  favorites: FavoritePoolSlotData[];
  isLoading: boolean;
  allFailed: boolean;
}

/**
 * State for the combined favorites view.
 */
export interface CombinedFavoritesState {
  slots: CombinedSlotData[];
  isLoadingFavorites: boolean;
  isLoadingAvailability: boolean;
  isEmpty: boolean;
  favoritesError?: string;
  refresh: () => void;
}
```

---

## Step 2: Create Data Fetching Hook

**File**: `packages/frontend/src/hooks/useCombinedFavoritesData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { generateForwardSlots } from '../utils/timeSlotUtils';
import type { CombinedFavoritesState, CombinedSlotData, FavoritePoolSlotData } from '../types/views';

export function useCombinedFavoritesData(
  date: string,
  startTime: string,
  duration: number,
  forwardSlotCount: number
): CombinedFavoritesState {
  const [favorites, setFavorites] = useState<FavoritePoolResponse[]>([]);
  const [slots, setSlots] = useState<CombinedSlotData[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string>();

  // Fetch favorites list
  const fetchFavorites = useCallback(async () => {
    setIsLoadingFavorites(true);
    try {
      const response = await api.listFavorites();
      setFavorites(response.favorites);
      setFavoritesError(undefined);
    } catch (error) {
      setFavoritesError('Failed to load favorites');
    } finally {
      setIsLoadingFavorites(false);
    }
  }, []);

  // Fetch availability for all favorites across all slots
  const fetchAvailability = useCallback(async () => {
    if (favorites.length === 0) return;

    setIsLoadingAvailability(true);
    const timeSlots = generateForwardSlots(startTime, duration, forwardSlotCount);

    // Initialize slots with loading state
    const initialSlots: CombinedSlotData[] = timeSlots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      header: `${slot.startTime} - ${slot.endTime}`,
      favorites: favorites.map(fav => ({
        pool: fav.pool,
        displayOrder: fav.displayOrder,
        lanes: [],
        availableCount: 0,
        totalCount: fav.pool.totalLanes,
        dataFreshness: 'unavailable' as const,
        status: 'loading' as const,
      })),
      isLoading: true,
      allFailed: false,
    }));
    setSlots(initialSlots);

    // Fetch all availability in parallel
    const requests = favorites.flatMap(favorite =>
      timeSlots.map(async (slot, slotIndex) => {
        try {
          const data = await api.getPoolAvailability(
            favorite.pool.id,
            date,
            slot.startTime,
            slot.endTime
          );
          return { favorite, slotIndex, data, error: null };
        } catch (error) {
          return { favorite, slotIndex, data: null, error: String(error) };
        }
      })
    );

    const results = await Promise.all(requests);

    // Update slots with results
    setSlots(currentSlots => {
      const updatedSlots = [...currentSlots];
      for (const result of results) {
        const slot = updatedSlots[result.slotIndex];
        const favIndex = slot.favorites.findIndex(f => f.pool.id === result.favorite.pool.id);
        if (favIndex >= 0) {
          if (result.data) {
            slot.favorites[favIndex] = {
              ...slot.favorites[favIndex],
              lanes: result.data.lanes,
              availableCount: result.data.availableLaneCount,
              totalCount: result.data.totalLaneCount,
              dataFreshness: result.data.dataFreshness,
              status: 'loaded',
            };
          } else {
            slot.favorites[favIndex] = {
              ...slot.favorites[favIndex],
              status: 'error',
              error: result.error ?? 'Unknown error',
            };
          }
        }
      }
      // Update slot-level states
      for (const slot of updatedSlots) {
        slot.isLoading = slot.favorites.some(f => f.status === 'loading');
        slot.allFailed = slot.favorites.every(f => f.status === 'error' || f.status === 'unavailable');
      }
      return updatedSlots;
    });

    setIsLoadingAvailability(false);
  }, [favorites, date, startTime, duration, forwardSlotCount]);

  // Initial fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch availability when favorites or time params change
  useEffect(() => {
    if (!isLoadingFavorites && favorites.length > 0) {
      fetchAvailability();
    }
  }, [isLoadingFavorites, favorites, date, startTime, duration, forwardSlotCount, fetchAvailability]);

  const refresh = useCallback(() => {
    fetchFavorites().then(() => fetchAvailability());
  }, [fetchFavorites, fetchAvailability]);

  return {
    slots,
    isLoadingFavorites,
    isLoadingAvailability,
    isEmpty: !isLoadingFavorites && favorites.length === 0,
    favoritesError,
    refresh,
  };
}
```

---

## Step 3: Create Combined Slot Section Component

**File**: `packages/frontend/src/components/CombinedSlotSection.tsx`

```typescript
import React from 'react';
import { CompactAvailabilityBar } from './CompactAvailabilityBar';
import { LaneGrid } from './LaneGrid';
import type { CombinedSlotData } from '../types/views';

interface CombinedSlotSectionProps {
  slot: CombinedSlotData;
  compactView: boolean;
}

export function CombinedSlotSection({ slot, compactView }: CombinedSlotSectionProps) {
  return (
    <section className="combined-slot-section">
      <h3 className="slot-header">{slot.header}</h3>

      {slot.allFailed && (
        <p className="all-failed-message">No availability data for any pools</p>
      )}

      {!slot.allFailed && slot.favorites.map(fav => (
        <div key={fav.pool.id} className="favorite-pool-row">
          <div className="pool-name-row">
            <span className="pool-name">{fav.pool.name}</span>
            {fav.dataFreshness !== 'fresh' && (
              <span className={`freshness-badge freshness-${fav.dataFreshness}`}>
                {fav.dataFreshness}
              </span>
            )}
          </div>

          {fav.status === 'loading' && (
            <div className="loading-indicator">Loading...</div>
          )}

          {fav.status === 'error' && (
            <div className="error-message">{fav.error}</div>
          )}

          {fav.status === 'unavailable' && (
            <div className="unavailable-message">Data unavailable</div>
          )}

          {fav.status === 'loaded' && compactView && (
            <CompactAvailabilityBar
              available={fav.availableCount}
              total={fav.totalCount}
            />
          )}

          {fav.status === 'loaded' && !compactView && (
            <LaneGrid lanes={fav.lanes} />
          )}
        </div>
      ))}
    </section>
  );
}
```

---

## Step 4: Update Home Page

**File**: `packages/frontend/src/pages/Home.tsx`

Add combined view to the existing Home page:

```typescript
import { useTimeSlotState } from '../hooks/useTimeSlotState';
import { useViewPreferences } from '../hooks/useViewPreferences';
import { useSlotNavigation } from '../hooks/useSlotNavigation';
import { useCombinedFavoritesData } from '../hooks/useCombinedFavoritesData';
import { CombinedSlotSection } from '../components/CombinedSlotSection';
import { SlotNavigationButtons } from '../components/SlotNavigationButtons';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { KeyboardHints } from '../components/KeyboardHints';

export function Home() {
  const timeSlot = useTimeSlotState();
  const viewPrefs = useViewPreferences();

  const combinedData = useCombinedFavoritesData(
    timeSlot.date,
    timeSlot.startTime,
    timeSlot.duration,
    viewPrefs.forwardSlotCount
  );

  const navigation = useSlotNavigation({
    currentSlot: timeSlot,
    onNavigate: timeSlot.setters.navigate,
    hasFocus: true,
  });

  // If no favorites, show existing empty state
  if (combinedData.isEmpty) {
    return <EmptyFavoritesState />;
  }

  return (
    <div
      className="home-combined-view"
      tabIndex={0}
      onKeyDown={navigation.handleKeyDown}
    >
      <TimeSlotPicker
        date={timeSlot.date}
        startTime={timeSlot.startTime}
        duration={timeSlot.duration}
        onDateChange={timeSlot.setters.setDate}
        onTimeChange={timeSlot.setters.setStartTime}
      />

      <SlotNavigationButtons
        onPrevious={navigation.goToPreviousSlot}
        onNext={navigation.goToNextSlot}
        canGoPrevious={navigation.canGoPrevious}
        canGoNext={navigation.canGoNext}
      />

      <ViewToggle
        compactView={viewPrefs.compactViewEnabled}
        onToggle={viewPrefs.setCompactViewEnabled}
      />

      {combinedData.isLoadingFavorites && <div>Loading favorites...</div>}

      {combinedData.favoritesError && (
        <div className="error">{combinedData.favoritesError}</div>
      )}

      {combinedData.slots.map(slot => (
        <CombinedSlotSection
          key={`${slot.startTime}-${slot.endTime}`}
          slot={slot}
          compactView={viewPrefs.compactViewEnabled}
        />
      ))}

      <KeyboardHints />
    </div>
  );
}
```

---

## Step 5: Add Basic Styles

**File**: `packages/frontend/src/pages/Home.css` (or equivalent)

```css
.home-combined-view {
  outline: none; /* Focus handled by keyboard navigation */
}

.combined-slot-section {
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.slot-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.favorite-pool-row {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.favorite-pool-row:last-child {
  border-bottom: none;
}

.pool-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pool-name {
  font-weight: 500;
}

.freshness-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
}

.freshness-cached { background: #fff3cd; color: #856404; }
.freshness-stale { background: #ffe5d0; color: #c35500; }
.freshness-unavailable { background: #f8d7da; color: #721c24; }

.all-failed-message,
.error-message,
.unavailable-message {
  color: #666;
  font-style: italic;
}

.loading-indicator {
  color: #888;
}
```

---

## Testing the Implementation

1. **Start development server**: `npm run dev`
2. **Add 2+ pools to favorites** (via pool detail page or search)
3. **Navigate to Home page** (`/` or `/favorites`)
4. **Verify combined view** shows time slots with all favorites
5. **Test navigation**: Arrow keys, previous/next buttons
6. **Test view toggle**: Compact ↔ Detailed
7. **Test slots ahead**: Increase forwardSlotCount in preferences

---

## Key Files Summary

| File | Purpose |
|------|---------|
| `types/views.ts` | New type definitions |
| `hooks/useCombinedFavoritesData.ts` | Data fetching orchestration |
| `components/CombinedSlotSection.tsx` | Slot section with multiple pools |
| `pages/Home.tsx` | Main page integration |
| `Home.css` | Basic styling |
