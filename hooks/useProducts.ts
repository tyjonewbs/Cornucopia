'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, ExtendedProduct } from '@/types/product';
import { DataLoadingState } from '@/types';

interface UseProductsOptions {
  userId?: string;
  marketStandId?: string;
  limit?: number;
  autoFetch?: boolean;
}

interface UseProductsReturn extends DataLoadingState<ExtendedProduct[]> {
  refetch: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
}

/**
 * Custom hook for managing products
 * Provides fetching, caching, and mutation capabilities for products
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    userId,
    marketStandId,
    limit = 20,
    autoFetch = true,
  } = options;

  const [state, setState] = useState<DataLoadingState<ExtendedProduct[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchProducts = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (marketStandId) params.append('marketStandId', marketStandId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/product?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      setState({
        data: data.products || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      });
    }
  }, [userId, marketStandId, limit]);

  const addProduct = useCallback((product: Product) => {
    setState((prev) => ({
      ...prev,
      data: prev.data ? [product as ExtendedProduct, ...prev.data] : [product as ExtendedProduct],
    }));
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      data: prev.data
        ? prev.data.map((p) => (p.id === id ? { ...p, ...updates } : p))
        : null,
    }));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      data: prev.data ? prev.data.filter((p) => p.id !== id) : null,
    }));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    ...state,
    refetch: fetchProducts,
    addProduct,
    updateProduct,
    removeProduct,
  };
}
