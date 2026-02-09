import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PoolDetail } from './PoolDetail';

// Mock all external dependencies
vi.mock('../services/api', () => ({
  api: {
    getPool: vi.fn().mockResolvedValue({ id: 'pool-1', name: 'Test Pool', location: 'Test Location' }),
    getPoolAvailability: vi.fn().mockResolvedValue({
      lanes: [],
      dataFreshness: 'fresh',
      scrapedAt: new Date().toISOString(),
      availableLaneCount: 0,
      totalLaneCount: 4,
    }),
    listFavorites: vi.fn().mockResolvedValue({ favorites: [] }),
    getDurationPreference: vi.fn().mockResolvedValue(60),
    getDefaultSlot: vi.fn().mockResolvedValue({ date: '2026-02-08', startTime: '10:00', endTime: '11:00' }),
  },
}));

vi.mock('../hooks/useTimeSlotState', () => ({
  useTimeSlotState: () => ({
    state: { date: '2026-02-08', startTime: '10:00', endTime: '11:00', duration: 60, slotIndex: 0 },
    setDate: vi.fn(),
    setStartTime: vi.fn(),
    setEndTime: vi.fn(),
    handleNavigation: vi.fn(),
    isInitialized: true,
  }),
}));

vi.mock('../hooks/useSlotNavigation', () => ({
  useSlotNavigation: () => ({
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    canNavigatePrevious: true,
    canNavigateNext: true,
    canExtend: true,
    canReduce: true,
    navigatePrevious: vi.fn(),
    navigateNext: vi.fn(),
    extendDuration: vi.fn(),
    reduceDuration: vi.fn(),
    handleKeyDown: vi.fn(),
  }),
}));

vi.mock('../hooks/useDebounceRefresh', () => ({
  useDebounceRefresh: () => ({
    isRefreshing: false,
    refreshNow: vi.fn(),
  }),
}));

vi.mock('../hooks/useViewPreferences', () => ({
  useViewPreferences: () => ({
    compactViewEnabled: false,
    setCompactViewEnabled: vi.fn(),
    forwardSlotCount: 1,
    setForwardSlotCount: vi.fn(),
    isLoading: false,
    isSaving: false,
  }),
}));

vi.mock('../hooks/useMultiSlotData', () => ({
  useMultiSlotData: () => ({
    slots: [],
    isLoading: false,
  }),
}));

function renderPoolDetail() {
  return render(
    <MemoryRouter initialEntries={['/pool/pool-1']}>
      <Routes>
        <Route path="/pool/:poolId" element={<PoolDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PoolDetail (009-US3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders .pool-detail-actions element', async () => {
    const { container } = renderPoolDetail();
    await waitFor(() => {
      expect(container.querySelector('.pool-detail-actions')).toBeInTheDocument();
    });
  });
});
