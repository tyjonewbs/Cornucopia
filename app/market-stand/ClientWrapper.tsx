'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, List } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { MarketStandCard } from "../../components/MarketStandCard";

// Dynamic import for MapView to handle SSR
const MapView = dynamic(
  () => import('../../components/MapView'),
  {
    ssr: false,
    loading: () => <div className="h-[600px] animate-pulse bg-gray-200 rounded-lg" />
  }
);

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  createdAt: Date;
  products: Product[];
  user: {
    firstName: string;
    profileImage: string;
  };
}

interface ClientWrapperProps {
  marketStands: MarketStand[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function ClientWrapper({ marketStands }: ClientWrapperProps) {
  const [currentView, setCurrentView] = useState<'map' | 'grid'>('grid');
  const [sortOrder, setSortOrder] = useState<'distance' | 'newest' | 'products'>('distance');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const standsWithDistance = marketStands.map(stand => ({
    ...stand,
    distance: userLocation
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          stand.latitude,
          stand.longitude
        )
      : undefined
  }));

  const sortedStands = [...standsWithDistance].sort((a, b) => {
    switch (sortOrder) {
      case 'distance':
        if (!a.distance || !b.distance) return 0;
        return a.distance - b.distance;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'products':
        return b.products.length - a.products.length;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* View Toggle and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={currentView === 'grid' ? 'default' : 'outline'}
            onClick={() => setCurrentView('grid')}
          >
            <List className="h-4 w-4 mr-2" />
            Grid View
          </Button>
          <Button
            variant={currentView === 'map' ? 'default' : 'outline'}
            onClick={() => setCurrentView('map')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>
        {currentView === 'grid' && (
          <Select
            value={sortOrder}
            onValueChange={(value: 'distance' | 'newest' | 'products') => setSortOrder(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="products">Most Products</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current View */}
      {currentView === 'map' ? (
        <MapView marketStands={sortedStands} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {sortedStands.map((stand) => (
                <MarketStandCard
                  key={stand.id}
                  {...stand}
                  locationName={stand.locationName}
                  locationGuide={stand.locationGuide}
                />
          ))}
        </div>
      )}
    </div>
  );
}
