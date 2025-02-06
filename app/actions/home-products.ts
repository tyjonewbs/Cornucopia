'use server';

import { getProducts, type ProductResponse } from "./products";

export interface LocationType {
  coords: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  };
  source: 'browser' | 'zipcode';
}

export interface SerializedProduct extends ProductResponse {
  distance: number | null;
  marketStand: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    locationName: string;
    user: {
      firstName: string;
      profileImage: string;
    };
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
  return R * c; // Distance in km
}

export const getHomeProducts = async (userLocation: LocationType | null, cursor?: string): Promise<SerializedProduct[]> => {
  try {
    console.log('Fetching products with location:', userLocation);
    const products = await getProducts({
      limit: cursor ? 12 : 50, // Fetch more initially for local filtering
      cursor,
      isActive: true,
      marketStandId: undefined,
    });

    console.log('Raw products:', products.length);

    const productsWithDistance = products.map((product: ProductResponse) => {
      if (!product.marketStand?.latitude || !product.marketStand?.longitude) {
        return { ...product, distance: null };
      }
      
      const distance = userLocation
        ? calculateDistance(
            userLocation.coords.lat,
            userLocation.coords.lng,
            product.marketStand.latitude,
            product.marketStand.longitude
          )
        : null;

      return {
        ...product,
        distance
      };
    });

    // Sort by distance if location available, otherwise by newest
    const sortedProducts = [...productsWithDistance].sort((a, b) => {
      if (!userLocation) {
        // Sort by newest if no location
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    }) as SerializedProduct[];

    console.log('Sorted products:', sortedProducts.length);

    // Log initial state
    console.log('Processing products:', {
      total: sortedProducts.length,
      hasLocation: !!userLocation,
      locationSource: userLocation?.source,
      cursor
    });

    // If we have a location, separate local and non-local products
    if (userLocation) {
      // Log location details
      console.log('Location details:', {
        lat: userLocation.coords.lat,
        lng: userLocation.coords.lng,
        source: userLocation.source,
        accuracy: userLocation.coords.accuracy
      });

      // Filter and log each product's distance
      const productsWithDistanceInfo = sortedProducts.map(p => ({
        id: p.id,
        name: p.name,
        distance: p.distance,
        isLocal: p.distance !== null && p.distance <= 241.4
      }));
      console.log('Product distances:', productsWithDistanceInfo);

      // Use a larger radius for zip code locations since they're less precise
      const localRadius = userLocation.source === 'zipcode' ? 321.87 : 241.4; // 200 miles for zip, 150 miles for browser
      const localProducts = sortedProducts.filter(p => p.distance !== null && p.distance <= localRadius);
      const otherProducts = sortedProducts.filter(p => p.distance === null || p.distance > localRadius);
      
      console.log('Filtered products:', {
        local: localProducts.length,
        other: otherProducts.length,
        radius: localRadius,
        cursor
      });

      // If loading initial products and we have less than 12 local products
      if (!cursor && localProducts.length < 12) {
        const combined = [...localProducts, ...otherProducts];
        console.log('Returning combined products:', combined.length);
        return combined;
      }
      
      // If loading more products, return non-local products
      if (cursor) {
        console.log('Returning explore products:', otherProducts.length);
        return otherProducts;
      }

      // Initial load with enough local products
      console.log('Returning local products:', localProducts.length);
      return localProducts;
    }

    // No location, return all products sorted by date
    console.log('Returning all products:', sortedProducts.length);
    return sortedProducts;
  } catch (error) {
    console.error('Error fetching home products:', error);
    return [];
  }
};
