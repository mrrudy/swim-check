import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Array<(e: { matches: boolean }) => void>;
  let currentMatches: boolean;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: currentMatches,
      media: query,
      addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
        listeners = listeners.filter((l) => l !== cb);
      }),
    })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when query does not match', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMediaQuery('(max-width: 799px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches', () => {
    currentMatches = true;
    const { result } = renderHook(() => useMediaQuery('(max-width: 799px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMediaQuery('(max-width: 799px)'));
    expect(result.current).toBe(false);

    // Simulate viewport resize — matchMedia now returns true
    currentMatches = true;
    act(() => {
      listeners.forEach((cb) => cb({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    currentMatches = false;
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 799px)'));
    const listenerCountBefore = listeners.length;
    expect(listenerCountBefore).toBeGreaterThan(0);

    unmount();
    expect(listeners.length).toBe(0);
  });
});
