'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProductCache } from "@/components/providers/ProductCacheProvider";
import { ProductCard } from "@/components/ProductCard";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { getHomeProducts, type SerializedProduct, type UserLocation } from "@/app/actions/home-products";
import LoadingStateGrid from "@/components/LoadingStateGrid";

interface ProductGridClientProps {
  initialProducts: SerializedProduct[];
  userLocation: { coords: { lat: number; lng: number } } | null;
}

export function ProductGridClient({ initialProducts, userLocation }: ProductGridClientProps) {
  // Convert to UserLocation type for home-products action
  const location = userLocation ? { coords: { ...userLocation.coords } } : null;
  const [localProducts, setLocalProducts] = useState<SerializedProduct[]>([]);
  const [exploreProducts, setExploreProducts] = useState<SerializedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locationError, isLoadingLocation, retryLocation } = useUserLocation();
  const [lastProductId, setLastProductId] = useState<string | undefined>(undefined);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize products when userLocation or initialProducts change
  useEffect(() => {
    if (!isHydrated) return;

    
    if (userLocation) {
      const local = initialProducts.filter(p => p.distance !== null && p.distance <= 241.4);
      const explore = initialProducts.filter(p => p.distance === null || p.distance > 241.4);
        
      setLocalProducts(local);
      setExploreProducts(explore);
      if (explore.length > 0) {
        setLastProductId(explore[explore.length - 1].id);
      }
    } else {
      setLocalProducts([]);
      setExploreProducts(initialProducts);
      if (initialProducts.length > 0) {
        setLastProductId(initialProducts[initialProducts.length - 1].id);
      }
    }
  }, [initialProducts, userLocation, isHydrated]);

  // Reset products when location changes
  useEffect(() => {
    if (!userLocation) {
      setLocalProducts([]);
      setExploreProducts(initialProducts);
    }
  }, [userLocation, initialProducts]);


  const { getCachedProducts, cacheProducts } = useProductCache();

  const loadMoreProducts = useCallback(async () => {
    if (!lastProductId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first for paginated results
      const locationForCache = userLocation ? { lat: userLocation.coords.lat, lng: userLocation.coords.lng } : null;
      const cachedProducts = locationForCache ? getCachedProducts(locationForCache, lastProductId) : null;
      
      if (cachedProducts) {
        if (cachedProducts.length > 0) {
          setLastProductId(cachedProducts[cachedProducts.length - 1].id);
          setExploreProducts(prev => [...prev, ...cachedProducts]);
        }
      } else {
        // If not in cache, fetch new products
        const newProducts = await getHomeProducts(location, lastProductId);
        
        if (newProducts.length > 0) {
          // Cache the paginated results
          if (locationForCache) {
            cacheProducts(newProducts, locationForCache, lastProductId);
          }
          
          setLastProductId(newProducts[newProducts.length - 1].id);
          setExploreProducts(prev => [...prev, ...newProducts]);
        }
      }
    } catch (err) {
      setError('Failed to load more products');
    } finally {
      setIsLoading(false);
    }
  }, [lastProductId, location, userLocation, getCachedProducts, cacheProducts]);

  if (!isHydrated || isLoading) {
    return <LoadingStateGrid />;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm leading-5 text-yellow-700">
                {locationError}
              </p>
            </div>
            <div className="ml-3">
              <Button
                variant="outline"
                size="sm"
                onClick={retryLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {userLocation && localProducts.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6">Local Products</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10 mb-12">
            {localProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                images={product.images}
                locationName={product.marketStand.locationName}
                updatedAt={product.updatedAt}
                price={product.price}
                tags={product.tags}
                distance={product.distance}
              />
            ))}
          </div>
        </>
      )}

      {exploreProducts.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6">Explore Products</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10">
            {exploreProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                images={product.images}
                locationName={product.marketStand.locationName}
                updatedAt={product.updatedAt}
                price={product.price}
                tags={product.tags}
                distance={product.distance}
              />
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="text-center mt-6">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {exploreProducts.length >= 12 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMoreProducts}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </section>
  );
}
