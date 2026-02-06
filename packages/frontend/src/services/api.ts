/**
 * API client for Swim Lane Booking Checker
 */

import type {
  ListPoolsResponse,
  PoolAvailabilityResponse,
  ListFavoritesResponse,
  FavoritePoolResponse,
  UserPreferencesResponse,
  DefaultTimeSlotResponse,
  HealthResponse,
  SchedulerStatusResponse,
  ApiError,
} from '@swim-check/shared';
import type { SwimmingPool } from '@swim-check/shared';

const API_BASE = '/api/v1';

class ApiClient {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Health
  async getHealth(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/health');
  }

  // Pools
  async listPools(search?: string, limit = 50, offset = 0): Promise<ListPoolsResponse> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    return this.fetch<ListPoolsResponse>(`/pools?${params}`);
  }

  async getPool(poolId: string): Promise<SwimmingPool> {
    return this.fetch<SwimmingPool>(`/pools/${poolId}`);
  }

  // Availability
  async getPoolAvailability(
    poolId: string,
    date: string,
    startTime: string,
    endTime: string,
    refresh = false
  ): Promise<PoolAvailabilityResponse> {
    const params = new URLSearchParams({
      date,
      startTime,
      endTime,
      refresh: String(refresh),
    });
    return this.fetch<PoolAvailabilityResponse>(`/pools/${poolId}/availability?${params}`);
  }

  // Favorites
  async listFavorites(): Promise<ListFavoritesResponse> {
    return this.fetch<ListFavoritesResponse>('/favorites');
  }

  async addFavorite(poolId: string): Promise<FavoritePoolResponse> {
    return this.fetch<FavoritePoolResponse>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ poolId }),
    });
  }

  async removeFavorite(poolId: string): Promise<void> {
    await this.fetch(`/favorites/${poolId}`, { method: 'DELETE' });
  }

  async reorderFavorites(order: string[]): Promise<ListFavoritesResponse> {
    return this.fetch<ListFavoritesResponse>('/favorites/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order }),
    });
  }

  // Preferences
  async getPreferences(): Promise<UserPreferencesResponse> {
    return this.fetch<UserPreferencesResponse>('/preferences');
  }

  async updatePreferences(updates: {
    slotDurationMins?: number;
    compactViewEnabled?: boolean;
    forwardSlotCount?: number;
  }): Promise<UserPreferencesResponse> {
    return this.fetch<UserPreferencesResponse>('/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getDefaultTimeSlot(): Promise<DefaultTimeSlotResponse> {
    return this.fetch<DefaultTimeSlotResponse>('/preferences/default-time-slot');
  }

  // Admin - Scraping Status (006-scraping-status-view)
  async getScrapingStatus(): Promise<SchedulerStatusResponse> {
    return this.fetch<SchedulerStatusResponse>('/admin/scheduler/status');
  }
}

export const api = new ApiClient();
