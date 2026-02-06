# Data Model: Favorites Combined Availability View

**Feature**: 007-favorites-combined-view
**Date**: 2026-02-06

## Overview

This document defines the data structures for the combined favorites availability view. The feature reuses existing backend entities and extends only the frontend view types.

---

## Existing Entities (No Changes Required)

### SwimmingPool
Already defined in `packages/shared/src/types/models.ts`.

```typescript
interface SwimmingPool {
  id: string;
  name: string;
  location: string;
  websiteUrl: string;
  totalLanes: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### LaneAvailability
Already defined in `packages/shared/src/types/models.ts`.

```typescript
interface LaneAvailability {
  laneId: string;
  laneNumber: number;
  label?: string;
  isAvailable: boolean;
  lastUpdated: Date;
}
```

### PoolAvailabilityResponse
Already defined in `packages/shared/src/types/api.ts`.

```typescript
interface PoolAvailabilityResponse {
  pool: SwimmingPool;
  date: string;
  timeSlot: TimeSlot;
  lanes: LaneAvailability[];
  dataFreshness: 'fresh' | 'cached' | 'stale' | 'unavailable';
  scrapedAt?: string;
  availableLaneCount: number;
  totalLaneCount: number;
}
```

### FavoritePoolResponse
Already defined in `packages/shared/src/types/api.ts`.

```typescript
interface FavoritePoolResponse {
  pool: SwimmingPool;
  addedAt: string;
  displayOrder: number;
}
```

### UserPreferencesResponse
Already defined in `packages/shared/src/types/api.ts`.

```typescript
interface UserPreferencesResponse {
  id: string;
  slotDurationMins: number;
  compactViewEnabled: boolean;
  forwardSlotCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## New Frontend View Types

These types are added to `packages/frontend/src/types/views.ts` for the combined view.

### FavoritePoolSlotData

Represents availability data for a single favorite pool within a specific time slot.

```typescript
/**
 * Availability data for a single favorite pool within a time slot.
 * Used in the combined favorites view.
 */
export interface FavoritePoolSlotData {
  /** The pool entity */
  pool: SwimmingPool;

  /** Display order from favorites list (lower = higher priority) */
  displayOrder: number;

  /** Lane availability data for this slot */
  lanes: LaneAvailability[];

  /** Available lane count (convenience field) */
  availableCount: number;

  /** Total lane count (convenience field) */
  totalCount: number;

  /** Data freshness indicator */
  dataFreshness: DataFreshness;

  /** Loading state for this specific pool */
  status: SlotStatus;

  /** Error message if fetch failed */
  error?: string;
}
```

### CombinedSlotData

Represents a single time slot with availability for all favorite pools.

```typescript
/**
 * A time slot section showing all favorite pools' availability.
 * This is the primary data structure for the combined view.
 */
export interface CombinedSlotData {
  /** Time slot start time (HH:MM) */
  startTime: string;

  /** Time slot end time (HH:MM) */
  endTime: string;

  /** Formatted header (e.g., "13:30 - 14:00") */
  header: string;

  /** Availability data for each favorite pool, ordered by displayOrder */
  favorites: FavoritePoolSlotData[];

  /** Overall loading state (true if any pool is still loading) */
  isLoading: boolean;

  /** Whether all pools have error or unavailable status */
  allFailed: boolean;
}
```

### CombinedFavoritesState

State returned by the `useCombinedFavoritesData` hook.

```typescript
/**
 * State for the combined favorites view, returned by useCombinedFavoritesData hook.
 */
export interface CombinedFavoritesState {
  /** Array of time slots with combined availability data */
  slots: CombinedSlotData[];

  /** True if initial favorites list is loading */
  isLoadingFavorites: boolean;

  /** True if any availability data is loading */
  isLoadingAvailability: boolean;

  /** True if no favorites exist */
  isEmpty: boolean;

  /** Error message if favorites list fetch failed */
  favoritesError?: string;

  /** Refresh function to refetch all data */
  refresh: () => void;
}
```

---

## Type Relationships

```
┌─────────────────────────┐
│ CombinedFavoritesState  │
│ (hook return type)      │
└───────────┬─────────────┘
            │ contains 1..N
            ▼
┌─────────────────────────┐
│ CombinedSlotData        │
│ (one per time slot)     │
└───────────┬─────────────┘
            │ contains 1..M
            ▼
┌─────────────────────────┐
│ FavoritePoolSlotData    │
│ (one per favorite pool) │
└───────────┬─────────────┘
            │ contains
            ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│ SwimmingPool            │     │ LaneAvailability[]      │
│ (existing type)         │     │ (existing type)         │
└─────────────────────────┘     └─────────────────────────┘
```

---

## State Transitions

### Loading States

```
Initial Load:
  ┌──────────────────┐
  │ isLoadingFavorites: true │
  │ isLoadingAvailability: false │
  │ slots: [] │
  └──────────────────┘
         │
         │ Favorites loaded
         ▼
  ┌──────────────────┐
  │ isLoadingFavorites: false │
  │ isLoadingAvailability: true │
  │ slots: [{ favorites: [{ status: 'loading' }] }] │
  └──────────────────┘
         │
         │ All availability loaded
         ▼
  ┌──────────────────┐
  │ isLoadingFavorites: false │
  │ isLoadingAvailability: false │
  │ slots: [{ favorites: [{ status: 'loaded' }] }] │
  └──────────────────┘
```

### Error States

```
FavoritePoolSlotData.status:
  - 'loading'     → Fetching availability
  - 'loaded'      → Successfully loaded
  - 'error'       → Fetch failed (error message in .error)
  - 'unavailable' → No data available for this slot

CombinedSlotData.allFailed:
  - true  → All favorites have status 'error' or 'unavailable'
  - false → At least one favorite has data
```

---

## Data Freshness

Inherited from existing `DataFreshness` type:

| Value | Meaning | Visual Indicator |
|-------|---------|-----------------|
| `'fresh'` | Data scraped within last hour | Green "Fresh" badge |
| `'cached'` | Data scraped within last 24 hours | Yellow "Cached" badge |
| `'stale'` | Data scraped more than 24 hours ago | Orange "Stale" badge |
| `'unavailable'` | No data available | Red "Unavailable" badge |

---

## Validation Rules

### FavoritePoolSlotData
- `pool.id`: Required, non-empty string
- `displayOrder`: Required, integer >= 0
- `lanes`: Required, array (may be empty if unavailable)
- `availableCount`: Required, integer >= 0
- `totalCount`: Required, integer >= 0
- `availableCount <= totalCount`: Always true
- `status`: Required, one of `SlotStatus` values
- `error`: Optional, only present when `status === 'error'`

### CombinedSlotData
- `startTime`: Required, format HH:MM (24-hour)
- `endTime`: Required, format HH:MM, must be > startTime
- `header`: Required, non-empty string
- `favorites`: Required, array (may be empty if no favorites)
- `favorites` order: Sorted by `displayOrder` ascending
- `isLoading`: Required, boolean
- `allFailed`: Required, boolean

---

## Database Schema

**No changes required.** Existing tables support all feature requirements:

- `swimming_pools`: Pool entities
- `favorite_pools`: User's favorite pools with display order
- `lane_bookings`: Lane availability data per time slot
- `user_preferences`: Compact view and forward slot count settings
- `scrape_jobs`: Data freshness tracking

---

## API Endpoints Used

**No new endpoints required.** The feature uses existing endpoints:

| Endpoint | Purpose | Response Type |
|----------|---------|---------------|
| `GET /api/v1/favorites` | Fetch favorite pools in order | `ListFavoritesResponse` |
| `GET /api/v1/pools/:poolId/availability` | Fetch pool availability | `PoolAvailabilityResponse` |
| `GET /api/v1/preferences` | Get view preferences | `UserPreferencesResponse` |
| `PATCH /api/v1/preferences` | Update view preferences | `UserPreferencesResponse` |
