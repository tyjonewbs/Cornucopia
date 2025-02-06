'use server';

interface GeocodingResponse {
  lat: number;
  lng: number;
  source: 'browser' | 'zipcode';
  accuracy?: number;
}

export async function geocodeZipCode(zipCode: string): Promise<GeocodingResponse | null> {
  try {
    // Using Zippopotam.us API - free, no auth required, and specifically for ZIP codes
    const response = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`,
      { 
        cache: 'no-store', // Disable caching to ensure fresh results
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.places?.[0]) {
      return null;
    }

    // API returns coordinates as strings, convert to numbers
    const lat = parseFloat(data.places[0].latitude);
    const lng = parseFloat(data.places[0].longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return { 
      lat, 
      lng,
      source: 'zipcode',
      accuracy: 5000 // ZIP codes typically have accuracy within 5km
    };
  } catch (error) {
    return null;
  }
}

export async function getBrowserLocation(): Promise<GeocodingResponse | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'browser',
          accuracy: position.coords.accuracy
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}
