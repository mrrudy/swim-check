# Quickstart: Scraping Status View

**Feature Branch**: `006-scraping-status-view`
**Date**: 2026-02-06

## Overview

This guide provides step-by-step instructions for implementing the Scraping Status View feature. Follow these steps after the specification and design documents have been approved.

---

## Prerequisites

- Node.js 20 LTS installed
- Repository cloned and on `006-scraping-status-view` branch
- Dependencies installed (`npm install` from root)
- Backend running (`npm run dev` from packages/backend)
- Frontend running (`npm run dev` from packages/frontend)

---

## Implementation Order

Follow this order to ensure tests pass incrementally:

### Phase 1: Backend Type Extensions

1. **Extend `PoolScraperMetadata` interface** (`packages/backend/src/scrapers/types.ts`)
   ```typescript
   interface SourceLink {
     url: string;
     label: string;
   }

   interface PoolScraperMetadata {
     poolId: string;
     name: string;
     version: string;
     sourceUrls?: SourceLink[];  // Add this
   }
   ```

2. **Update Aquapark scraper** (`packages/backend/src/scrapers/pools/aquapark-wroclaw-borowska/index.ts`)
   ```typescript
   export class AquaparkWroclawScraper implements PoolScraper {
     readonly poolId = AQUAPARK_POOL_ID;
     readonly name = 'aquapark-wroclaw-borowska';
     readonly version = '1.0.0';
     readonly sourceUrls = [
       { url: AQUAPARK_SCHEDULE_URL, label: 'Schedule Page' }
     ];
     // ... rest unchanged
   }
   ```

3. **Update Śleża scraper** (`packages/backend/src/scrapers/pools/sleza-centrum/index.ts`)
   ```typescript
   export class SlezaCentrumScraper implements PoolScraper {
     readonly poolId = SLEZA_POOL_ID;
     readonly name = 'sleza-centrum';
     readonly version = '1.0.0';
     readonly sourceUrls = [
       { url: SLEZA_SCHEDULE_PAGE_URL, label: 'Schedule Page' },
       { url: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}`, label: 'Google Sheets' }
     ];
     // ... rest unchanged
   }
   ```

### Phase 2: Shared Type Extensions

4. **Extend API types** (`packages/shared/src/types/api.ts`)
   ```typescript
   export interface SourceLink {
     url: string;
     label: string;
   }

   export interface PoolScrapeStatusResponse {
     poolId: string;
     poolName: string;
     lastScrapeDate: string | null;
     lastScrapeTimestamp: string | null;  // Add
     lastScrapeStatus: 'success' | 'failure' | null;
     lastErrorMessage: string | null;     // Add
     inProgress: boolean;
     sourceUrls: SourceLink[];            // Add
   }
   ```

### Phase 3: Backend API Extension

5. **Update admin endpoint** (`packages/backend/src/api/admin.ts`)
   - Modify the `/scheduler/status` handler to include new fields
   - Get `lastScrapeTimestamp` and `lastErrorMessage` from `getScrapeJob()`
   - Get `sourceUrls` from scraper instance via registry

### Phase 4: Frontend Implementation

6. **Create timestamp utility** (`packages/frontend/src/utils/formatTime.ts`)
   ```typescript
   export function formatScrapedAt(timestamp: string | null): string {
     // Implementation from research.md
   }

   export type ScrapingStatusType = 'success' | 'stale' | 'failed' | 'never' | 'in-progress';

   export function getStatusType(
     status: 'success' | 'failure' | null,
     timestamp: string | null,
     inProgress: boolean
   ): ScrapingStatusType {
     // Implementation from research.md
   }
   ```

7. **Add API function** (`packages/frontend/src/services/api.ts`)
   ```typescript
   export async function getScrapingStatus(): Promise<SchedulerStatusResponse> {
     const response = await fetch(`${API_BASE_URL}/admin/scheduler/status`);
     if (!response.ok) throw new Error('Failed to fetch scraping status');
     return response.json();
   }
   ```

8. **Create ScrapingStatus page** (`packages/frontend/src/pages/ScrapingStatus.tsx`)
   - Fetch status on mount
   - Render pool list with status badges
   - Handle loading and error states

9. **Add navigation and route** (`packages/frontend/src/App.tsx`)
   ```tsx
   import { ScrapingStatus } from './pages/ScrapingStatus';

   // In nav:
   <Link to="/scraping-status" style={styles.navLink}>
     Scraping Status
   </Link>

   // In Routes:
   <Route path="/scraping-status" element={<ScrapingStatus />} />
   ```

---

## Test Verification

Run these commands to verify implementation:

```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests
cd packages/frontend
npm test

# Lint all
cd ../..
npm run lint
```

---

## Manual Testing Checklist

- [ ] Navigate to Scraping Status tab from any page
- [ ] Verify all configured pools are displayed
- [ ] Verify timestamps show relative time for recent scrapes
- [ ] Verify status badges show correct colors:
  - Green for success (<24h)
  - Amber for stale (≥24h)
  - Red for failed
  - Gray for never scraped
  - Blue for in-progress
- [ ] Click source links and verify they open in new tab
- [ ] Verify error messages display for failed scrapes
- [ ] Test with backend offline (error state)

---

## Key Files to Create/Modify

### New Files
| Path | Description |
|------|-------------|
| `packages/frontend/src/pages/ScrapingStatus.tsx` | Main view component |
| `packages/frontend/src/utils/formatTime.ts` | Timestamp utilities |

### Modified Files
| Path | Changes |
|------|---------|
| `packages/backend/src/scrapers/types.ts` | Add `SourceLink`, extend metadata |
| `packages/backend/src/scrapers/pools/*/index.ts` | Add `sourceUrls` to scrapers |
| `packages/backend/src/api/admin.ts` | Include new fields in response |
| `packages/shared/src/types/api.ts` | Extend `PoolScrapeStatusResponse` |
| `packages/frontend/src/services/api.ts` | Add `getScrapingStatus()` |
| `packages/frontend/src/App.tsx` | Add route and nav link |

---

## Common Issues

### Issue: "Unknown scraper field sourceUrls"
**Solution**: Ensure `PoolScraper` interface extends `PoolScraperMetadata` correctly in types.ts

### Issue: API returns 404 for scheduler status
**Solution**: Verify backend is running and scheduler is started. Check `/api/v1/health` first.

### Issue: Timestamps show wrong times
**Solution**: Ensure `lastScrapeTimestamp` is properly converted to ISO string in backend response.

---

## Success Criteria

Feature is complete when:
1. All tests pass
2. Manual testing checklist is verified
3. Page loads in <3 seconds (SC-001)
4. Issues identifiable in <5 seconds via visual indicators (SC-002)
5. All source links work (SC-003)
