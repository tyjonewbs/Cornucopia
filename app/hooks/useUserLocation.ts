import { useState, useEffect } from 'react';

interface UserLocation {
  lat: number;
  lng: number;
}

interface UseUserLocationResult {
  userLocation: UserLocation | null;
  locationError: string | null;
  isLoadingLocation: boolean;
}

export default function useUserLocation(): UseUserLocationResult {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          setLocationError('Failed to get your location.');
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
    }
  }, []);

  return { userLocation, locationError, isLoadingLocation };
}
