'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ProductGridClient } from "@/components/ProductGrid/ProductGridClient";
import LoadingStateGrid from "@/components/LoadingStateGrid";
import { ErrorBoundary } from "react-error-boundary";
import ProductError from "@/components/ProductGrid/error";
import { type SerializedProduct, getHomeProducts } from "./actions/geo-products";
import { useLocation } from "@/components/providers/LocationProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { ProductFilters, ProductFilterState, DEFAULT_FILTERS } from "@/components/ProductFilters";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const { userLocation } = useLocation();
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);

  // Track if location has actually changed from initial state
  const previousLocationRef = useRef<typeof userLocation>(null);
  const isInitialMount = useRef(true);

  // Fetch products when location changes OR when we have a cached location on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newProducts = await getHomeProducts(
          userLocation?.coords.lat,
          userLocation?.coords.lng,
          userLocation?.source,
          userLocation?.zipCode,
          userLocation?.coords.accuracy,
          userLocation?.coords.timestamp
        );

        if (Array.isArray(newProducts)) {
          setProducts(newProducts);
        } else {
          console.error('Invalid products response:', newProducts);
          setError('Failed to load products. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to update products. Please try again.');
        setProducts(initialProducts);
      } finally {
        setIsLoading(false);
      }
    };

    // On initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousLocationRef.current = userLocation;

      // If we have a cached location on mount, fetch products for that location
      // (the server-rendered initialProducts were fetched without location)
      if (userLocation) {
        fetchProducts();
      }
      return;
    }

    // Check if location actually changed
    const locationChanged =
      previousLocationRef.current?.coords.lat !== userLocation?.coords.lat ||
      previousLocationRef.current?.coords.lng !== userLocation?.coords.lng ||
      previousLocationRef.current?.zipCode !== userLocation?.zipCode;

    if (!locationChanged) {
      return;
    }

    previousLocationRef.current = userLocation;
    fetchProducts();
  }, [userLocation, initialProducts]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (filters.categories.length > 0) {
        const productTags = product.tags.map((t) => t.toLowerCase());
        const hasMatchingCategory = filters.categories.some((cat) =>
          productTags.some((tag) => tag.includes(cat) || cat.includes(tag))
        );
        if (!hasMatchingCategory) return false;
      }

      // Distance filter
      if (product.distance !== null && product.distance > filters.distance * 1.60934) {
        // Convert miles to km (distance is stored in km)
        return false;
      }

      // Price filter
      if (filters.priceMin !== null && product.price < filters.priceMin * 100) {
        return false;
      }
      if (filters.priceMax !== null && product.price > filters.priceMax * 100) {
        return false;
      }

      // Fulfillment filter
      if (filters.fulfillment.length > 0) {
        const hasPickup = !!product.marketStand;
        const hasDelivery = product.deliveryInfo?.isAvailable ?? false;

        if (filters.fulfillment.includes("pickup") && !filters.fulfillment.includes("delivery")) {
          if (!hasPickup) return false;
        }
        if (filters.fulfillment.includes("delivery") && !filters.fulfillment.includes("pickup")) {
          if (!hasDelivery) return false;
        }
        if (filters.fulfillment.includes("pickup") && filters.fulfillment.includes("delivery")) {
          if (!hasPickup && !hasDelivery) return false;
        }
      }

      return true;
    });
  }, [products, filters]);

  const handleFiltersChange = useCallback((newFilters: ProductFilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-56px-64px)] md:min-h-[calc(100vh-80px)]">
      <AppSidebar showHeader={false}>
        <ProductFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </AppSidebar>
      <main className="flex-1 px-3 md:px-8 py-4 md:py-8">
      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <ErrorBoundary FallbackComponent={ProductError}>
        {isLoading ? (
          <LoadingStateGrid />
        ) : (
          <ProductGridClient
            key={userLocation?.coords.lat || 'no-location'}
            initialProducts={filteredProducts}
            userLocation={userLocation}
          />
        )}
      </ErrorBoundary>
      </main>
    </div>
  );
}
