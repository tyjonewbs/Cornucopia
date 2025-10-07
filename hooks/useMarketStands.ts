'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketStand, MarketStandWithDistance } from '@/types/marketStand';
import { DataLoadingState } from '@/types';

interface UseMarketStandsOptions {
  userId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseMarketStandsReturn extends DataLoadingState<MarketStandWithDistance[]> {
  refetch: () => Promise<void>;
  addMarketStand: (marketStand: MarketStand) => void;
  updateMarketStand: (id: string, updates: Partial<MarketStand>) => void;
  removeMarketStand: (id: string) => void;
}

/**
 * Custom hook for managing market stands
 * Provides fetching, caching, and mutation capabilities for market stands
 */
export function useMarketStands(
  options: UseMarketStandsOptions = {}
): UseMarketStandsReturn {
  const {
    userId,
    latitude,
    longitude,
    radiusKm = 50,
    limit = 20,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<DataLoadingState<MarketStandWithDistance[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchMarketStands = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (latitude !== undefined) params.append('latitude', latitude.toString());
      if (longitude !== undefined) params.append('longitude', longitude.toString());
      if (radiusKm !== undefined) params.append('radiusKm', radiusKm.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/market-stand?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market stands');
      }

      const data = await response.json();
      
      setState({
        data: data.marketStands || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market stands',
      });
    }
  }, [userId, latitude, longitude, radiusKm, limit]);

  const addMarketStand = useCallback((marketStand: MarketStand) => {
    setState((prev) => ({
      ...prev,
      data: prev.data
        ? [marketStand as MarketStandWithDistance, ...prev.data]
        : [marketStand as MarketStandWithDistance],
    }));
  }, []);

  const updateMarketStand = useCallback((id: string, updates: Partial<MarketStand>) => {
    setState((prev) => ({
      ...prev,
      data: prev.data
        ? prev.data.map((ms) => (ms.id === id ? { ...ms, ...updates } : ms))
        : null,
    }));
  }, []);

  const removeMarketStand = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      data: prev.data ? prev.data.filter((ms) => ms.id !== id) : null,
    }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchMarketStands();
    }
  }, [autoFetch, fetchMarketStands]);

  return {
    ...state,
    refetch: fetchMarketStands,
    addMarketStand,
    updateMarketStand,
    removeMarketStand,
  };
}
