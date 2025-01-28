'use server';

import { getProducts, type ProductResponse } from "./products";

export interface UserLocation {
  coords: {
    lat: number;
    lng: number;
  };
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

export const getHomeProducts = async (userLocation: UserLocation | null): Promise<SerializedProduct[]> => {
  try {
    const products = await getProducts({
      limit: 50,
      isActive: true,
      marketStandId: undefined,
    });

    const productsWithDistance = products.map((product: ProductResponse) => {
      if (!product.marketStand?.latitude || !product.marketStand?.longitude) {
        return { ...product, distance: null };
      }
      
      return {
        ...product,
        distance: userLocation
          ? calculateDistance(
              userLocation.coords.lat,
              userLocation.coords.lng,
              product.marketStand.latitude,
              product.marketStand.longitude
            )
          : null
      };
    });

    // Sort by distance if location available, otherwise by newest
    const sortedProducts = [...productsWithDistance].sort((a, b) => {
      if (!userLocation) return 0;
      if (a.distance === null || b.distance === null) return 0;
      return a.distance - b.distance;
    });

    return sortedProducts as SerializedProduct[];
  } catch (error) {
    console.error('Error fetching home products:', error);
    return [];
  }
};
