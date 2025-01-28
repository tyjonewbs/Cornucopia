'use server';

interface GeocodingResponse {
  lat: number;
  lng: number;
}

export async function geocodeZipCode(zipCode: string): Promise<GeocodingResponse | null> {
  try {
    // Using the Census.gov Geocoding API which is free and doesn't require authentication
    // Using Zippopotam.us API - free, no auth required, and specifically for ZIP codes
    const response = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`,
      { cache: 'force-cache' }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (!data.places?.[0]) {
      return null;
    }

    // API returns coordinates as strings, convert to numbers
    const lat = parseFloat(data.places[0].latitude);
    const lng = parseFloat(data.places[0].longitude);

    return { lat, lng };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
