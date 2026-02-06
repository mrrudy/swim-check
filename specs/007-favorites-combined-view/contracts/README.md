# API Contracts: Favorites Combined Availability View

**Feature**: 007-favorites-combined-view
**Date**: 2026-02-06

## Summary

**No new API contracts required.** This feature is implemented entirely on the frontend using existing backend endpoints.

## Existing Endpoints Used

### 1. List Favorites

```
GET /api/v1/favorites
```

**Response**: `ListFavoritesResponse`

```json
{
  "favorites": [
    {
      "pool": {
        "id": "aquapark-wroclaw-borowska",
        "name": "Aquapark Wrocław",
        "location": "Borowska 99",
        "websiteUrl": "https://aquapark.wroc.pl",
        "totalLanes": 8,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      },
      "addedAt": "2025-06-15T10:30:00Z",
      "displayOrder": 0
    },
    {
      "pool": {
        "id": "sleza-centrum",
        "name": "Ślęża Centrum",
        "location": "ul. Sportowa 1",
        "websiteUrl": "https://sleza.pl",
        "totalLanes": 6,
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2025-01-01T00:00:00Z"
      },
      "addedAt": "2025-06-16T14:00:00Z",
      "displayOrder": 1
    }
  ]
}
```

### 2. Get Pool Availability

```
GET /api/v1/pools/:poolId/availability?date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
```

**Response**: `PoolAvailabilityResponse`

```json
{
  "pool": {
    "id": "aquapark-wroclaw-borowska",
    "name": "Aquapark Wrocław",
    "location": "Borowska 99",
    "websiteUrl": "https://aquapark.wroc.pl",
    "totalLanes": 8,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  "date": "2026-02-06",
  "timeSlot": {
    "startTime": "13:30",
    "endTime": "14:00"
  },
  "lanes": [
    {"laneId": "lane-1", "laneNumber": 1, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-2", "laneNumber": 2, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-3", "laneNumber": 3, "isAvailable": false, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-4", "laneNumber": 4, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-5", "laneNumber": 5, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-6", "laneNumber": 6, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-7", "laneNumber": 7, "isAvailable": false, "lastUpdated": "2026-02-06T12:00:00Z"},
    {"laneId": "lane-8", "laneNumber": 8, "isAvailable": true, "lastUpdated": "2026-02-06T12:00:00Z"}
  ],
  "dataFreshness": "fresh",
  "scrapedAt": "2026-02-06T12:00:00Z",
  "availableLaneCount": 6,
  "totalLaneCount": 8
}
```

### 3. Get User Preferences

```
GET /api/v1/preferences
```

**Response**: `UserPreferencesResponse`

```json
{
  "id": "default-user",
  "slotDurationMins": 30,
  "compactViewEnabled": true,
  "forwardSlotCount": 2,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2026-02-06T10:00:00Z"
}
```

### 4. Update User Preferences

```
PATCH /api/v1/preferences
```

**Request Body**:

```json
{
  "compactViewEnabled": false,
  "forwardSlotCount": 3
}
```

**Response**: `UserPreferencesResponse` (updated)

## Frontend Data Flow

```
┌─────────────────┐
│ Home.tsx loads  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ GET /favorites  │────▶│ List of pools   │
└─────────────────┘     │ with order      │
                        └────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ GET /pools/A/   │     │ GET /pools/B/   │     │ GET /pools/C/   │
│ availability    │     │ availability    │     │ availability    │
│ (slot 1)        │     │ (slot 1)        │     │ (slot 1)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ├───────────────────────┼───────────────────────┤
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ GET /pools/A/   │     │ GET /pools/B/   │     │ GET /pools/C/   │
│ availability    │     │ availability    │     │ availability    │
│ (slot 2)        │     │ (slot 2)        │     │ (slot 2)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ CombinedSlotData│
                        │ organized by    │
                        │ time slot       │
                        └─────────────────┘
```

## Rationale for No New Endpoints

1. **Existing endpoints are sufficient**: All required data is accessible via current API
2. **Parallel fetching is performant**: Browser can handle concurrent requests efficiently
3. **Simplicity principle**: Avoid backend changes when frontend composition works
4. **Consistency**: Uses same endpoints as pool detail page, ensuring data consistency
