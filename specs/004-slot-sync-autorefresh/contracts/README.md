# Contracts: Time Slot Selection Synchronization with Auto-Refresh

**Date**: 2026-02-02
**Feature**: 004-slot-sync-autorefresh

## Overview

This feature is **frontend-only** and does not introduce new API endpoints or modify existing backend contracts.

## Existing API Dependencies

The feature uses the existing availability API endpoint:

### GET /api/v1/pools/:poolId/availability

**Existing Contract** (no changes required):

```typescript
// Request
GET /api/v1/pools/:poolId/availability
  ?date=YYYY-MM-DD
  &startTime=HH:MM
  &endTime=HH:MM
  &refresh=true|false

// Response (PoolAvailabilityResponse)
{
  "lanes": [
    {
      "laneNumber": number,
      "availability": "available" | "partial" | "unavailable",
      "segments": [...]
    }
  ],
  "dataFreshness": "fresh" | "cached" | "stale" | "unavailable",
  "scrapedAt": "ISO8601 timestamp",
  "availableLaneCount": number,
  "totalLaneCount": number
}
```

## Optional Enhancement: AbortController Support

For concurrent request handling (FR-009), the API client (`api.ts`) may benefit from supporting the `AbortSignal` interface:

```typescript
// Current signature
getPoolAvailability(
  poolId: string,
  date: string,
  startTime: string,
  endTime: string,
  refresh?: boolean
): Promise<PoolAvailabilityResponse>

// Enhanced signature (optional)
getPoolAvailability(
  poolId: string,
  date: string,
  startTime: string,
  endTime: string,
  options?: {
    refresh?: boolean,
    signal?: AbortSignal  // For request cancellation
  }
): Promise<PoolAvailabilityResponse>
```

**Note**: This enhancement is optional. The feature can work without it by simply allowing overlapping requests and using the most recent result.

## Component Contracts

See [data-model.md](../data-model.md) for the TypeScript interfaces that define component prop contracts:

- `TimeSlotPickerProps` - Controlled component interface
- `UseSlotNavigationProps` / `UseSlotNavigationReturn` - Navigation hook interface
- `UseTimeSlotStateReturn` - Unified state hook interface
- `UseDebounceRefreshReturn` - Debounce hook interface
