'use server';

interface GeocodingResponse {
  lat: number;
  lng: number;
}

export async function geocodeZipCode(zipCode: string): Promise<GeocodingResponse | null> {
  try {
    console.log('Geocoding zip code:', zipCode);
    // Using Zippopotam.us API - free, no auth required, and specifically for ZIP codes
    const response = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`,
      { 
        cache: 'no-store', // Disable caching to ensure fresh results
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (!data.places?.[0]) {
      console.log('No location found for zip code');
      return null;
    }

    // API returns coordinates as strings, convert to numbers
    const lat = parseFloat(data.places[0].latitude);
    const lng = parseFloat(data.places[0].longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates in response:', data.places[0]);
      return null;
    }

    console.log('Location found:', { lat, lng });
    return { lat, lng };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
