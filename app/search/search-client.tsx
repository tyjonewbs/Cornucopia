'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { MarketStandCard } from '@/components/MarketStandCard';
import { LocalCard } from '@/components/LocalCard';
import { AppSidebar } from '@/components/AppSidebar';
import { SearchFilters, SearchFilterState, DEFAULT_SEARCH_FILTERS } from '@/components/SearchFilters';
import type { GlobalSearchResults, SearchResult } from '@/app/actions/global-search';

interface SearchClientProps {
  results: GlobalSearchResults;
  zipCode: string;
  searchQuery?: string;
}

export default function SearchClient({ results, zipCode, searchQuery = '' }: SearchClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilterState>(DEFAULT_SEARCH_FILTERS);

  const { products, marketStands, farms, location } = results;

  // Format distance for display
  const formatDistance = (distanceKm: number | null): string => {
    if (distanceKm === null) return '';
    const miles = distanceKm * 0.621371;
    return miles < 1 
      ? `${(miles * 5280).toFixed(0)} ft` 
      : `${miles.toFixed(1)} mi`;
  };

  // Apply filters to results
  const filteredResults = useMemo(() => {
    let allResults: SearchResult[] = [];

    // Filter by result type
    if (filters.resultType === 'all') {
      allResults = [...products, ...marketStands, ...farms];
    } else if (filters.resultType === 'products') {
      allResults = [...products];
    } else if (filters.resultType === 'stands') {
      allResults = [...marketStands];
    } else if (filters.resultType === 'farms') {
      allResults = [...farms];
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      allResults = allResults.filter((result) => {
        // Only products and market stands have tags, farms don't
        if (result.resultType === 'farm') return false;
        const tags = result.tags?.map((t: string) => t.toLowerCase()) || [];
        return filters.categories.some((cat) =>
          tags.some((tag: string) => tag.includes(cat) || cat.includes(tag))
        );
      });
    }

    // Apply distance filter
    allResults = allResults.filter((result) => {
      if (result.distance === null) return true;
      return result.distance <= filters.distance * 1.60934; // Convert miles to km
    });

    // Apply price filter (only for products)
    if (filters.priceMin !== null || filters.priceMax !== null) {
      allResults = allResults.filter((result) => {
        if (result.resultType !== 'product') return true;
        const price = result.price;
        if (filters.priceMin !== null && price < filters.priceMin * 100) return false;
        if (filters.priceMax !== null && price > filters.priceMax * 100) return false;
        return true;
      });
    }

    // Apply fulfillment filter (only for products)
    if (filters.fulfillment.length > 0) {
      allResults = allResults.filter((result) => {
        if (result.resultType !== 'product') return true;
        
        const hasPickup = !!result.marketStand;
        const hasDelivery = result.deliveryInfo?.isAvailable ?? false;

        if (filters.fulfillment.includes("pickup") && !filters.fulfillment.includes("delivery")) {
          return hasPickup;
        }
        if (filters.fulfillment.includes("delivery") && !filters.fulfillment.includes("pickup")) {
          return hasDelivery;
        }
        if (filters.fulfillment.includes("pickup") && filters.fulfillment.includes("delivery")) {
          return hasPickup || hasDelivery;
        }
        return true;
      });
    }

    // Sort by distance
    return allResults.sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }, [products, marketStands, farms, filters]);

  const handleSearchClear = useCallback(() => {
    // Navigate back to search page without query parameter
    router.push(`/search?zip=${zipCode}`);
  }, [router, zipCode]);

  const handleFiltersChange = useCallback((newFilters: SearchFilterState) => {
    setFilters(newFilters);
  }, []);

  // Calculate counts for sidebar
  const counts = useMemo(() => ({
    all: products.length + marketStands.length + farms.length,
    products: products.length,
    stands: marketStands.length,
    farms: farms.length,
  }), [products.length, marketStands.length, farms.length]);

  if (!location) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Zip Code</h1>
          <p className="text-muted-foreground">
            We couldn't find results for zip code {zipCode}. Please try a different zip code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px-64px)] md:min-h-[calc(100vh-80px)]">
      <AppSidebar showHeader={false}>
        <SearchFilters
          searchQuery={searchQuery}
          onSearchClear={handleSearchClear}
          zipCode={zipCode}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          counts={counts}
        />
      </AppSidebar>
      <main className="flex-1 px-3 md:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Search Results'}
          </h1>
          <p className="text-muted-foreground">
            Found {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} near {zipCode}
          </p>
        </div>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No results found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {filteredResults.map((result) => {
              if (result.resultType === 'product') {
                // Cast to any to bypass type checking - the data is correct at runtime
                const productProps = result as any;
                return (
                  <div key={`product-${result.id}`} className="relative">
                    <ProductCard {...productProps} />
                    {result.distance !== null && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                        {formatDistance(result.distance)}
                      </div>
                    )}
                  </div>
                );
              } else if (result.resultType === 'market-stand') {
                return (
                  <div key={`stand-${result.id}`} className="relative">
                    <MarketStandCard stand={result} />
                    {result.distance !== null && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                        {formatDistance(result.distance)}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={`farm-${result.id}`} className="relative">
                    <LocalCard local={{ ...result, _count: { products: 0 } }} userId="" />
                    {result.distance !== null && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                        {formatDistance(result.distance)}
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}
      </main>
    </div>
  );
}
