'use client';

import { useState } from 'react';
import { MarketStandViewNav } from "@components/MarketStandViewNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { MarketStandCard } from "@/components/MarketStandCard";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { type MarketStand } from "@/app/actions/market-stands";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

interface MarketStandsGridProps {
  initialStands: MarketStand[];
}

export function MarketStandsGrid({ initialStands }: MarketStandsGridProps) {
  const [marketStands] = useState<MarketStand[]>(initialStands);
  const [sortOrder, setSortOrder] = useState<'newest' | 'distance'>('newest');
  const { userLocation, locationError, isLoadingLocation, retryLocation } = useUserLocation();

  const sortedStands = [...marketStands].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'distance':
        if (!userLocation) return 0;
        const distA = calculateDistance(userLocation.coords.lat, userLocation.coords.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.coords.lat, userLocation.coords.lng, b.latitude, b.longitude);
        return distA - distB;
      default:
        return 0;
    }
  });

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Stands</h1>
        <p className="text-muted-foreground mt-2">
          Discover local market stands near you
        </p>
      </div>

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

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <MarketStandViewNav currentView="grid" />
          <Select
            value={sortOrder}
            onValueChange={(value: 'newest' | 'distance') => setSortOrder(value)}
            disabled={!userLocation}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={userLocation ? "Sort by..." : "Location unavailable"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="distance">Nearest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {sortedStands.map((stand) => (
            <MarketStandCard
              key={stand.id}
              stand={{
                id: stand.id,
                name: stand.name,
                description: stand.description,
                locationName: stand.locationName,
                locationGuide: stand.locationGuide,
                latitude: stand.latitude,
                longitude: stand.longitude,
                images: stand.images,
                tags: stand.tags,
                _count: {
                  products: stand.products.length
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
