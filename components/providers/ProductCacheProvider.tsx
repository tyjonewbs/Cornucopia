'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { SerializedProduct } from '@/app/actions/home-products';

interface CacheEntry {
  products: SerializedProduct[];
  timestamp: number;
  cursor?: string;
}

interface LocationCacheData {
  local: CacheEntry;
  explore: CacheEntry;
}

type LocationCache = Map<string, LocationCacheData>;

interface ProductCacheContextType {
  getCachedProducts: (location: { lat: number; lng: number } | null, cursor?: string) => SerializedProduct[] | null;
  cacheProducts: (products: SerializedProduct[], location: { lat: number; lng: number } | null, cursor?: string) => void;
  invalidateCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const ProductCacheContext = createContext<ProductCacheContextType | null>(null);

function getLocationHash(location: { lat: number; lng: number } | null): string {
  if (!location) return 'no-location';
  // Round coordinates to 2 decimal places for cache grouping
  const lat = Math.round(location.lat * 100) / 100;
  const lng = Math.round(location.lng * 100) / 100;
  return `${lat},${lng}`;
}

export function ProductCacheProvider({ children }: { children: ReactNode }) {
  const getCachedProducts = useCallback((location: { lat: number; lng: number } | null, cursor?: string): SerializedProduct[] | null => {
    if (typeof window === 'undefined') return null;

    try {
      const locationHash = getLocationHash(location);
      const cacheKey = `products-${locationHash}${cursor ? `-${cursor}` : ''}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (!cachedData) return null;

      const { products, timestamp } = JSON.parse(cachedData);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return products;
    } catch (error) {
      return null;
    }
  }, []);

  const cacheProducts = useCallback((products: SerializedProduct[], location: { lat: number; lng: number } | null, cursor?: string) => {
    if (typeof window === 'undefined') return;

    try {
      const locationHash = getLocationHash(location);
      const cacheKey = `products-${locationHash}${cursor ? `-${cursor}` : ''}`;
      const cacheData = {
        products,
        timestamp: Date.now(),
        cursor
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
    }
  }, []);

  const invalidateCache = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('products-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
    }
  }, []);

  return (
    <ProductCacheContext.Provider value={{ getCachedProducts, cacheProducts, invalidateCache }}>
      {children}
    </ProductCacheContext.Provider>
  );
}

export function useProductCache() {
  const context = useContext(ProductCacheContext);
  if (!context) {
    throw new Error('useProductCache must be used within a ProductCacheProvider');
  }
  return context;
}
