/**
 * User Location Cache Utility
 * Manages caching of user location data across the application
 */

export interface CachedLocation {
  zipCode?: string;
  city?: string;
  state?: string;
  coords?: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  source: 'zipcode' | 'geolocation' | 'manual';
}

const CACHE_KEY = 'user_delivery_location';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached user location
 */
export function getCachedLocation(): CachedLocation | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const location = JSON.parse(cached) as CachedLocation;
    
    // Check if cache is expired
    if (Date.now() - location.timestamp > CACHE_DURATION) {
      clearCachedLocation();
      return null;
    }
    
    return location;
  } catch (error) {
    console.error('Error reading cached location:', error);
    return null;
  }
}

/**
 * Save user location to cache
 */
export function setCachedLocation(location: Omit<CachedLocation, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const locationWithTimestamp: CachedLocation = {
      ...location,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(locationWithTimestamp));
  } catch (error) {
    console.error('Error saving cached location:', error);
  }
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cached location:', error);
  }
}

/**
 * Get cached zip code (convenience function)
 */
export function getCachedZipCode(): string | null {
  const location = getCachedLocation();
  return location?.zipCode || null;
}

/**
 * Save zip code to cache (convenience function)
 */
export function setCachedZipCode(zipCode: string, coords?: { lat: number; lng: number }): void {
  setCachedLocation({
    zipCode,
    coords,
    source: 'zipcode',
  });
}
