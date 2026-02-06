/**
 * Tests for useViewPreferences hook persistence (005-pool-view-options)
 * TDD: Write tests FIRST, ensure they FAIL before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useViewPreferences } from './useViewPreferences';
import { api } from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

describe('useViewPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('default values', () => {
    it('should have default compactViewEnabled as true', () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      expect(result.current.compactViewEnabled).toBe(true);
    });

    it('should have default forwardSlotCount as 1', () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      expect(result.current.forwardSlotCount).toBe(1);
    });
  });

  describe('loading from API', () => {
    it('should load preferences from API on mount', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: false,
        forwardSlotCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.compactViewEnabled).toBe(false);
        expect(result.current.forwardSlotCount).toBe(3);
      });
    });

    it('should set isLoading to true while fetching', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(api.getPreferences).mockReturnValue(promise as any);

      const { result } = renderHook(() => useViewPreferences());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          id: 'test-id',
          slotDurationMins: 60,
          compactViewEnabled: true,
          forwardSlotCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('saving to API', () => {
    it('should save compactViewEnabled to API when changed', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(api.updatePreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: false,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.setCompactViewEnabled(false);
      });

      await waitFor(() => {
        expect(api.updatePreferences).toHaveBeenCalledWith({ compactViewEnabled: false });
      });
    });

    it('should save forwardSlotCount to API when changed', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(api.updatePreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.setForwardSlotCount(5);
      });

      await waitFor(() => {
        expect(api.updatePreferences).toHaveBeenCalledWith({ forwardSlotCount: 5 });
      });
    });

    it('should set isSaving to true while saving', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });

      vi.mocked(api.updatePreferences).mockReturnValue(savePromise as any);

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setCompactViewEnabled(false);
      });

      // isSaving should be true while request is in flight
      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolveSave!({
          id: 'test-id',
          slotDurationMins: 60,
          compactViewEnabled: false,
          forwardSlotCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });
  });

  describe('optimistic updates', () => {
    it('should update local state immediately before API response', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });

      vi.mocked(api.updatePreferences).mockReturnValue(savePromise as any);

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setCompactViewEnabled(false);
      });

      // Should be updated immediately (optimistic update)
      expect(result.current.compactViewEnabled).toBe(false);

      await act(async () => {
        resolveSave!({
          id: 'test-id',
          slotDurationMins: 60,
          compactViewEnabled: false,
          forwardSlotCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors when loading', async () => {
      vi.mocked(api.getPreferences).mockRejectedValue(new Error('Failed to load'));

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load');
      });
    });

    it('should handle API errors when saving', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(api.updatePreferences).mockRejectedValue(new Error('Failed to save'));

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.setCompactViewEnabled(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to save');
      });
    });
  });

  describe('value clamping', () => {
    it('should clamp forwardSlotCount to minimum of 1', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(api.updatePreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.setForwardSlotCount(0);
      });

      expect(result.current.forwardSlotCount).toBe(1);
    });

    it('should clamp forwardSlotCount to maximum of 10', async () => {
      vi.mocked(api.getPreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.mocked(api.updatePreferences).mockResolvedValue({
        id: 'test-id',
        slotDurationMins: 60,
        compactViewEnabled: true,
        forwardSlotCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useViewPreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.setForwardSlotCount(15);
      });

      expect(result.current.forwardSlotCount).toBe(10);
    });
  });
});
