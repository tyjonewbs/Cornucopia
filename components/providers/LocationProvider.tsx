'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { geocodeZipCode } from '@/app/actions/geocode';
import { setCachedZipCode, getCachedLocation } from '@/lib/utils/location-cache';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationType {
  coords: LocationCoords;
  source: 'browser' | 'zipcode';
  zipCode?: string;
}

interface LocationContextType {
  userLocation: LocationType | null;
  isLoading: boolean;
  error: string | null;
  zipCode: string;
  setZipCode: (zip: string) => void;
  searchByZip: () => Promise<void>;
  useMyLocation: () => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [isLoadingBrowserLocation, setIsLoadingBrowserLocation] = useState(false);

  // Check for cached location on mount
  useEffect(() => {
    const cached = getCachedLocation();
    if (cached && cached.zipCode && cached.coords) {
      setZipCode(cached.zipCode);
      setUserLocation({
        coords: {
          lat: cached.coords.lat,
          lng: cached.coords.lng,
          timestamp: Date.now()
        },
        source: 'zipcode',
        zipCode: cached.zipCode
      });
    }
  }, []);

  const searchByZip = useCallback(async () => {
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
        setUserLocation(null);
        return;
      }

      const zipLocation: LocationType = {
        coords: {
          lat: location.lat,
          lng: location.lng,
          timestamp: Date.now()
        },
        source: 'zipcode',
        zipCode: zipCode
      };

      // Cache the zip code
      setCachedZipCode(zipCode, {
        lat: location.lat,
        lng: location.lng
      });

      setUserLocation(zipLocation);
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to search by zip code');
      setUserLocation(null);
    } finally {
      setIsLoading(false);
    }
  }, [zipCode]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingBrowserLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const browserLocation: LocationType = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          },
          source: 'browser'
        };
        setUserLocation(browserLocation);
        setIsLoadingBrowserLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location');
        setIsLoadingBrowserLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setUserLocation(null);
    setZipCode('');
    setError(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isLoading: isLoading || isLoadingBrowserLocation,
        error,
        zipCode,
        setZipCode,
        searchByZip,
        useMyLocation,
        clearLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
