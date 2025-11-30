'use client';

import { useState, useEffect, useRef } from "react";
import { ProductGridClient } from "@/components/ProductGrid/ProductGridClient";
import LoadingStateGrid from "@/components/LoadingStateGrid";
import { ErrorBoundary } from "react-error-boundary";
import ProductError from "@/components/ProductGrid/error";
import { type SerializedProduct, getHomeProducts } from "./actions/geo-products";
import { useLocation } from "@/components/providers/LocationProvider";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const { userLocation } = useLocation();
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if location has actually changed from initial state
  const previousLocationRef = useRef<typeof userLocation>(null);
  const isInitialMount = useRef(true);

  // Only fetch products when location actually changes (not on initial mount)
  useEffect(() => {
    // Skip initial mount - we already have server-rendered products
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousLocationRef.current = userLocation;
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

    fetchProducts();
  }, [userLocation, initialProducts]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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
            initialProducts={products} 
            userLocation={userLocation}
          />
        )}
      </ErrorBoundary>
    </main>
  );
}
