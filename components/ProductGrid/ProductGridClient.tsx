'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductCard } from "@/components/ProductCard";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { getHomeProducts, type SerializedProduct, type LocationType } from "@/app/actions/home-products";
import LoadingStateGrid from "@/components/LoadingStateGrid";

interface ProductGridClientProps {
  initialProducts: SerializedProduct[];
  userLocation: LocationType | null;
}

export function ProductGridClient({ initialProducts, userLocation }: ProductGridClientProps) {
  const [products, setProducts] = useState(() => {
    try {
      console.log('Initializing products state with:', {
        hasLocation: !!userLocation,
        initialProductsCount: initialProducts.length
      });
      
      // Initialize products state once during component mount
      if (userLocation) {
        const local = initialProducts.filter(p => p.distance !== null && p.distance <= 160.934);
        const explore = initialProducts.filter(p => p.distance === null || p.distance > 160.934);
        console.log('Initial products split:', {
          localCount: local.length,
          exploreCount: explore.length
        });
        return {
          local,
          explore,
          lastId: explore.length > 0 ? explore[explore.length - 1].id : undefined
        };
      }
      return {
        local: [],
        explore: initialProducts,
        lastId: initialProducts.length > 0 ? initialProducts[initialProducts.length - 1].id : undefined
      };
    } catch (error) {
      console.error('Error initializing products state:', error);
      // Provide a safe fallback state
      return {
        local: [],
        explore: [],
        lastId: undefined
      };
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locationError, isLoadingLocation, retryLocation } = useUserLocation();
  const isHydrated = useRef(false);

  // Set hydration state
  useEffect(() => {
    isHydrated.current = true;
  }, []);

  // Update products when location or initial data changes
  useEffect(() => {
    try {
      console.log('Updating products state:', {
        hasLocation: !!userLocation,
        initialProductsCount: initialProducts.length
      });

      if (userLocation) {
        const local = initialProducts.filter(p => p.distance !== null && p.distance <= 160.934);
        const explore = initialProducts.filter(p => p.distance === null || p.distance > 160.934);
        console.log('Updated products split:', {
          localCount: local.length,
          exploreCount: explore.length
        });
        setProducts({
          local,
          explore,
          lastId: explore.length > 0 ? explore[explore.length - 1].id : undefined
        });
      } else {
        setProducts({
          local: [],
          explore: initialProducts,
          lastId: initialProducts.length > 0 ? initialProducts[initialProducts.length - 1].id : undefined
        });
      }
    } catch (error) {
      console.error('Error updating products state:', error);
      // Don't update state on error to prevent reverting to explore-only view
    }
  }, [initialProducts, userLocation]);

  const loadMoreProducts = async () => {
    if (!products.lastId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading more products with cursor:', products.lastId);
      const newProducts = await getHomeProducts(userLocation, products.lastId);
      console.log('Loaded additional products:', newProducts.length);
      
      if (newProducts.length > 0) {
        setProducts(prev => {
          const updatedState = {
            ...prev,
            explore: [...prev.explore, ...newProducts],
            lastId: newProducts[newProducts.length - 1].id
          };
          console.log('Updated products state:', {
            localCount: updatedState.local.length,
            exploreCount: updatedState.explore.length
          });
          return updatedState;
        });
      }
    } catch (err) {
      console.error('Error loading more products:', err);
      setError('Failed to load more products');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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

      {userLocation && (
        <>
          <h2 className="text-2xl font-bold mb-6">Local Products</h2>
          {products.local.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10 mb-12">
              {products.local.map((product) => (
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
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg mb-12">
              <h3 className="text-xl font-semibold mb-4">No Local Products Yet</h3>
              <p className="text-gray-600 mb-6">Be the first to sell products in your area!</p>
              <Button
                onClick={() => window.location.href = '/market-stand/setup'}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Become the First
              </Button>
            </div>
          )}
        </>
      )}

      {(!userLocation || products.local.length < 15) && products.explore.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-6">Explore Products</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10">
            {products.explore.map((product) => (
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

      {products.explore.length >= 12 && (
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
