'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ProductCard } from '@/components/ProductCard';
import { MarketStandCard } from '@/components/MarketStandCard';
import { LocalCard } from '@/components/LocalCard';
import { AppSidebar } from '@/components/AppSidebar';
import { SearchFilters, SearchFilterState, DEFAULT_SEARCH_FILTERS } from '@/components/SearchFilters';
import type { GlobalSearchResults, SearchResult, SearchResultEvent } from '@/app/actions/global-search';
import Link from 'next/link';
import Image from 'next/image';

interface SearchClientProps {
  results: GlobalSearchResults;
  zipCode: string;
  searchQuery?: string;
}

// Event card component for search results
function EventSearchCard({ event, formatDistance }: { event: SearchResultEvent; formatDistance: (distance: number | null) => string }) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  const dateDisplay = isSameDay
    ? format(startDate, 'MMM d, yyyy')
    : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <Link href={event.href} className="block group">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
        {event.images.length > 0 ? (
          <Image
            src={event.images[0]}
            alt={event.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {event.distance !== null && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
            {formatDistance(event.distance)}
          </div>
        )}
      </div>
      <div className="mt-2">
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-[#E07A2D] transition-colors">
          {event.name}
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {dateDisplay}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
          {event.locationName}
        </p>
      </div>
    </Link>
  );
}

export default function SearchClient({ results, zipCode, searchQuery = '' }: SearchClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilterState>(DEFAULT_SEARCH_FILTERS);

  const { products, marketStands, farms, events, location } = results;

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
      allResults = [...products, ...marketStands, ...farms, ...events];
    } else if (filters.resultType === 'products') {
      allResults = [...products];
    } else if (filters.resultType === 'stands') {
      allResults = [...marketStands];
    } else if (filters.resultType === 'farms') {
      allResults = [...farms];
    } else if (filters.resultType === 'events') {
      allResults = [...events];
    }

    // Apply category filter - normalize hyphens/special chars for matching
    if (filters.categories.length > 0) {
      const normalize = (s: string) => s.toLowerCase().replace(/[-&]/g, ' ').replace(/\s+/g, ' ').trim();
      allResults = allResults.filter((result) => {
        // Only products, market stands, and events have tags; farms don't
        if (result.resultType === 'farm') return false;
        const tags = result.tags?.map((t: string) => normalize(t)) || [];
        return filters.categories.some((cat) => {
          const normalizedCat = normalize(cat);
          return tags.some((tag: string) => tag.includes(normalizedCat) || normalizedCat.includes(tag));
        });
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
  }, [products, marketStands, farms, events, filters]);

  const handleSearchClear = useCallback(() => {
    // Navigate back to search page without query parameter
    router.push(`/search?zip=${zipCode}`);
  }, [router, zipCode]);

  const handleFiltersChange = useCallback((newFilters: SearchFilterState) => {
    setFilters(newFilters);
  }, []);

  // Calculate counts for sidebar
  const counts = useMemo(() => ({
    all: products.length + marketStands.length + farms.length + events.length,
    products: products.length,
    stands: marketStands.length,
    farms: farms.length,
    events: events.length,
  }), [products.length, marketStands.length, farms.length, events.length]);

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
    <div className="flex min-h-[calc(100vh-56px-64px)] md:min-h-[calc(100vh-80px)] overflow-x-hidden w-full">
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
      <main className="flex-1 min-w-0 px-3 md:px-8 py-4 md:py-8 overflow-x-hidden">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
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
              } else if (result.resultType === 'event') {
                return (
                  <EventSearchCard
                    key={`event-${result.id}`}
                    event={result}
                    formatDistance={formatDistance}
                  />
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
