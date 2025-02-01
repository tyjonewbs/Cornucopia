'use client';

import { useState, useCallback, useEffect } from "react";
import { ProductGridClient } from "@/components/ProductGrid/ProductGridClient";
import LoadingStateGrid from "@/components/LoadingStateGrid";
import { ErrorBoundary } from "react-error-boundary";
import ProductError from "@/components/ProductGrid/error";
import { type SerializedProduct, getHomeProducts } from "./actions/home-products";
import { ZipSearchBanner } from "@/components/ZipSearchBanner";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [userLocation, setUserLocation] = useState<{ coords: { lat: number; lng: number } } | null>(null);
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLocationUpdate = useCallback(async (location: { lat: number; lng: number } | null) => {
    try {
      setIsLoading(true);
      const newLocation = location ? { coords: { lat: location.lat, lng: location.lng } } : null;
      
      // Set location first to trigger proper loading state
      setUserLocation(newLocation);
      
      // Fetch new products sorted by the new location
      const locationForApi = newLocation ? { coords: { ...newLocation.coords } } : null;
      const newProducts = await getHomeProducts(locationForApi);
      console.log('New products fetched:', newProducts.length);
      
      setProducts(newProducts);
    } catch (error) {
      console.error('Error updating products:', error);
      // Reset location and products on error
      setUserLocation(null);
      setProducts(initialProducts);
    } finally {
      setIsLoading(false);
    }
  }, [initialProducts]);

  if (!isHydrated) {
    return <LoadingStateGrid />;
  }

  return (
    <main>
      <ZipSearchBanner onLocationUpdate={handleLocationUpdate} />
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
