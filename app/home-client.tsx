'use client';

import { useState, useCallback, useEffect } from "react";
import { ProductGridClient } from "@/components/ProductGrid/ProductGridClient";
import LoadingStateGrid from "@/components/LoadingStateGrid";
import { ErrorBoundary } from "react-error-boundary";
import ProductError from "@/components/ProductGrid/error";
import { type SerializedProduct, type LocationType, getHomeProducts } from "./actions/home-products";
import { ZipSearchBanner } from "@/components/ZipSearchBanner";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationUpdatePending, setLocationUpdatePending] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLocationUpdate = useCallback(async (location: LocationType | null) => {
    try {
      setIsLoading(true);
      setError(null);
      setLocationUpdatePending(true);
      console.log('Updating location:', location);
      
      // Set location first to trigger proper loading state
      setUserLocation(location);
      
      // Fetch new products sorted by the new location
      const newProducts = await getHomeProducts(location);
      console.log('New products fetched:', {
        count: newProducts?.length ?? 0,
        hasLocation: !!location,
        isValidArray: Array.isArray(newProducts)
      });
      
      // Validate the response is an array before updating
      if (Array.isArray(newProducts)) {
        setProducts(newProducts);
      } else {
        console.error('Invalid products response (not an array):', {
          type: typeof newProducts,
          value: newProducts
        });
        setError('Failed to load products. Please try again.');
        // Keep current products and location rather than resetting
      }
    } catch (error) {
      console.error('Error updating products:', error);
      setError('Failed to update products. Please try again.');
      
      // Reset location and restore initial products on error
      setUserLocation(null);
      // Validate initialProducts before setting
      const safeInitialProducts = Array.isArray(initialProducts) ? initialProducts : [];
      setProducts(safeInitialProducts);
    } finally {
      setIsLoading(false);
      setLocationUpdatePending(false);
    }
  }, [initialProducts]);

  if (!isHydrated) {
    return <LoadingStateGrid />;
  }

  return (
    <main>
      <ZipSearchBanner onLocationUpdate={handleLocationUpdate} />
      {error && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
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
