'use client';

import { useState, useCallback, useEffect } from "react";
import { useProductCache } from "@/components/providers/ProductCacheProvider";
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

  const { getCachedProducts, cacheProducts } = useProductCache();

  const handleLocationUpdate = useCallback(async (location: { lat: number; lng: number } | null) => {
    try {
      setIsLoading(true);
      const newLocation = location ? { coords: { lat: location.lat, lng: location.lng } } : null;
      
      // Set location first to trigger proper loading state
      setUserLocation(newLocation);

      // Check cache first
      const cachedProducts = newLocation ? getCachedProducts({ lat: newLocation.coords.lat, lng: newLocation.coords.lng }) : null;
      if (cachedProducts) {
        console.log('Using cached products:', cachedProducts.length);
        setProducts(cachedProducts);
        setIsLoading(false);
        return;
      }
      
      // If not in cache, fetch new products
      const locationForApi = newLocation ? { coords: { ...newLocation.coords } } : null;
      const newProducts = await getHomeProducts(locationForApi);
      
      // Cache the new products
      if (newLocation) {
        cacheProducts(newProducts, { lat: newLocation.coords.lat, lng: newLocation.coords.lng });
      }
      
      setProducts(newProducts);
    } catch (error) {
      // Reset location and products on error
      setUserLocation(null);
      setProducts(initialProducts);
    } finally {
      setIsLoading(false);
    }
  }, [initialProducts, getCachedProducts, cacheProducts]);

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
