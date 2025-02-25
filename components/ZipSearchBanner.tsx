'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { geocodeZipCode } from "@/app/actions/geocode";
import { type LocationType } from "@/app/actions/home-products";
import { MapPin } from 'lucide-react';
import useUserLocation from '@/app/hooks/useUserLocation';

interface ZipSearchBannerProps {
  onLocationUpdate: (location: LocationType | null) => void;
}

export function ZipSearchBanner({ onLocationUpdate }: ZipSearchBannerProps) {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    userLocation,
    locationError,
    isLoadingLocation,
    retryLocation
  } = useUserLocation({
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
    onSuccess: useCallback((location: LocationType) => {
      onLocationUpdate(location);
    }, [onLocationUpdate])
  });

  const handleSearch = useCallback(async () => {
    if (!zipCode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const location = await geocodeZipCode(zipCode);
      
      if (!location) {
        setError('Invalid zip code');
        onLocationUpdate(null);
        return;
      }

      const zipLocation: LocationType = {
        coords: {
          lat: location.lat,
          lng: location.lng,
          timestamp: Date.now()
        },
        source: 'zipcode'
      };

      console.log('Zip code location found:', zipLocation);
      onLocationUpdate(zipLocation);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to search by zip code');
      onLocationUpdate(null);
    } finally {
      setIsLoading(false);
    }
  }, [zipCode, onLocationUpdate]);

  return (
    <div className="w-full h-[500px] relative mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/images/zip-search-banner.avif")' }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-md max-w-4xl">
          Harvesting Nature's Best for You
        </h1>
        <p className="text-white text-xl mb-12 max-w-2xl drop-shadow">
          Experience the finest organic produce, sustainably grown and handpicked with care.
          Join us in nurturing the earth while enjoying its freshest offerings.
        </p>
        <div className="flex gap-2 justify-center">
          <Input
            type="text"
            placeholder="Enter Zip Code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="w-[280px] px-4 py-3 bg-white/95 shadow-lg text-lg placeholder:text-gray-500"
            maxLength={5}
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="shadow-lg text-lg px-8 bg-[#0B4D2C] hover:bg-[#0B4D2C]/90 text-white"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            onClick={retryLocation}
            variant="outline"
            className="shadow-lg"
            disabled={isLoadingLocation}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use My Location
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2 bg-white/95 px-3 py-1 rounded shadow">
            {error}
          </p>
        )}
        {isLoadingLocation && (
          <p className="text-white text-sm mt-2 bg-black/30 px-3 py-1 rounded">
            Getting your location...
          </p>
        )}
      </div>
    </div>
  );
}
