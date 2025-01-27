'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UserLocation {
  coords: Coordinates;
  cached?: boolean;
}

interface UseUserLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  minAccuracy?: number;
  cacheKey?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseUserLocationResult {
  userLocation: UserLocation | null;
  locationError: string | null;
  isLoadingLocation: boolean;
  retryLocation: () => void;
  accuracy: number | null;
  lastUpdated: number | null;
  clearLocation: () => void;
}

const DEFAULT_OPTIONS: UseUserLocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // Increased timeout
  maximumAge: 5 * 60 * 1000, // 5 minutes
  watchPosition: false,
  minAccuracy: 2000, // Increased to 2km to be more lenient
  cacheKey: 'user_location',
  retryAttempts: 5, // Increased retry attempts
  retryDelay: 2000, // Increased delay between retries
};

const isLocationValid = (location: UserLocation | null, minAccuracy: number): boolean => {
  if (!location?.coords) return false;
  return location.coords.accuracy <= minAccuracy;
};

const getCachedLocation = (cacheKey: string): UserLocation | null => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsed.coords.timestamp;

    // Validate cache freshness (default 5 minutes)
    if (age > DEFAULT_OPTIONS.maximumAge!) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return {
      ...parsed,
      cached: true
    };
  } catch {
    return null;
  }
};

const cacheLocation = (location: UserLocation, cacheKey: string): void => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to cache location:', error);
  }
};

export default function useUserLocation(options: UseUserLocationOptions = {}): UseUserLocationResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const {
    enableHighAccuracy,
    timeout,
    maximumAge,
    watchPosition,
    minAccuracy,
    cacheKey,
    retryAttempts,
    retryDelay
  } = mergedOptions;

  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    // Initialize with cached data if available
    return getCachedLocation(cacheKey!);
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Forward declarations
  const requestLocationRef = useRef<() => void>(() => {});
  const requestLocationFnRef = useRef<() => void>(() => requestLocationRef.current());

  const handleLocationSuccess = useCallback((position: GeolocationPosition): void => {
    const newLocation: UserLocation = {
      coords: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }
    };

    // Always set the location, but continue trying to get better accuracy if needed
    setUserLocation(newLocation);
    setAccuracy(position.coords.accuracy);
    setLastUpdated(position.timestamp);
    cacheLocation(newLocation, cacheKey!);

    if (!isLocationValid(newLocation, minAccuracy!)) {
      setLocationError(`Location accuracy is ${Math.round(position.coords.accuracy)}m (trying to improve...)`);
      if (retryCountRef.current < retryAttempts!) {
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current++;
          requestLocationFnRef.current();
        }, retryDelay! * Math.pow(2, retryCountRef.current));
      }
    } else {
      setLocationError(null);
      retryCountRef.current = 0;
    }
    setIsLoadingLocation(false);
  }, [minAccuracy, cacheKey, retryAttempts, retryDelay]);

  const handleLocationError = useCallback((error: GeolocationPositionError): void => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location services in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your device settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please check your connection and try again.';
        break;
      default:
        errorMessage = `Failed to get location: ${error.message}`;
    }

    setLocationError(errorMessage);
    setIsLoadingLocation(false);

    // Retry on certain errors
    if (error.code !== error.PERMISSION_DENIED && retryCountRef.current < retryAttempts!) {
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current++;
        requestLocationFnRef.current();
      }, retryDelay! * Math.pow(2, retryCountRef.current));
    }
  }, [retryAttempts, retryDelay]);

  const clearLocation = useCallback((): void => {
    setUserLocation(null);
    setLocationError(null);
    setAccuracy(null);
    setLastUpdated(null);
    localStorage.removeItem(cacheKey!);
  }, [cacheKey]);

  const retryLocation = useCallback((): void => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryCountRef.current = 0;
    requestLocationFnRef.current();
  }, []);

  // Initialize requestLocationRef implementation
  useEffect(() => {
    requestLocationRef.current = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser.');
        return;
      }

      if (!window.isSecureContext) {
        setLocationError('Geolocation requires a secure context (HTTPS).');
        return;
      }

      setIsLoadingLocation(true);
      setLocationError(null);

      const options: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge
      };

      if (watchPosition && !watchIdRef.current) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleLocationSuccess,
          handleLocationError,
          options
        );
      } else {
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          handleLocationError,
          options
        );
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, handleLocationSuccess, handleLocationError]);

  // Start location tracking
  useEffect(() => {
    requestLocationFnRef.current();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    userLocation,
    locationError,
    isLoadingLocation,
    retryLocation,
    accuracy,
    lastUpdated,
    clearLocation
  };
}
