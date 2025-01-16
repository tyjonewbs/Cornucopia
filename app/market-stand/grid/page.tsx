'use client';

import { useState, useEffect } from 'react';
import { MarketStandViewNav } from "@components/MarketStandViewNav";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { MarketStandCard } from "@components/MarketStandCard";
import Link from "next/link";

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
  tags: string[];
  products: Product[];
  user: {
    firstName: string;
    profileImage: string;
  };
}

async function getData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const res = await fetch('/api/market-stand', { 
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Market stand fetch failed:', {
        status: res.status,
        statusText: res.statusText,
        errorData
      });
      throw new Error(errorData.error || 'Failed to fetch market stands');
    }

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid market stand data:', data);
      throw new Error('Invalid response format');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

export default function MarketStandsGridPage() {
  const [marketStands, setMarketStands] = useState<MarketStand[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'distance'>('newest');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const data = await getData();
        if (mounted) {
          console.log('Successfully fetched market stands:', {
            count: data.length,
            hasImages: data.some(stand => stand.images?.length > 0)
          });
          setMarketStands(data);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Market Stands</h1>
          <p className="text-red-500 mt-2">{error}</p>
        </div>
      </section>
    );
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const sortedStands = [...marketStands].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'distance':
        if (!userLocation) return 0;
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Market Stands</h1>
          <p className="text-muted-foreground mt-2">Loading market stands...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Stands</h1>
        <p className="text-muted-foreground mt-2">
          Discover local market stands near you
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <MarketStandViewNav currentView="grid" />
          <Select
            value={sortOrder}
            onValueChange={(value: 'newest' | 'distance') => setSortOrder(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
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
