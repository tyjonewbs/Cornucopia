'use client';

import { useState, useEffect } from 'react';
import MarketStandsMap from "@components/MarketStandsMap";
import { MarketStandViewNav } from "@components/MarketStandViewNav";

interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  createdAt: string;
  tags: string[];
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  user: {
    firstName: string;
    profileImage: string;
  };
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

async function getData() {
  const res = await fetch('/api/market-stand', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch market stands');
  }
  return res.json();
}

export default function MarketStandsMapPage() {
  const [marketStands, setMarketStands] = useState<MarketStand[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getData()
      .then(data => {
        setMarketStands(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching market stands:', error);
        setIsLoading(false);
      });
  }, []);

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

  const standsWithDistance = marketStands.map(stand => {
    // Ensure dates are serialized as strings
    const serializedStand = {
      ...stand,
      createdAt: new Date(stand.createdAt).toISOString(),
      products: stand.products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt).toISOString(),
        updatedAt: new Date(product.updatedAt).toISOString(),
      }))
    };

    return {
      ...serializedStand,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            stand.latitude,
            stand.longitude
          )
        : undefined
    };
  });

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Market Stands Map</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Stands Map</h1>
        <p className="text-muted-foreground mt-2">
          Discover local market stands near you
        </p>
      </div>

      <div className="mb-6">
        <MarketStandViewNav currentView="map" />
      </div>

      <MarketStandsMap 
        marketStands={standsWithDistance}
        userLocation={userLocation}
      />
    </section>
  );
}
