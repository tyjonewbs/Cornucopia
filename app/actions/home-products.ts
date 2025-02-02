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

export const getHomeProducts = async (userLocation: UserLocation | null, cursor?: string): Promise<SerializedProduct[]> => {
  try {
    const products = await getProducts({
      limit: cursor ? 12 : 50, // Fetch more initially for local filtering
      cursor,
      isActive: true,
      marketStandId: undefined,
    });


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

    // If we have a location, separate local and non-local products
    if (userLocation) {
      const localProducts = sortedProducts.filter(p => p.distance !== null && p.distance <= 241.4); // 150 miles in km
      const otherProducts = sortedProducts.filter(p => p.distance === null || p.distance > 241.4);

      // If loading initial products and we have less than 12 local products
      if (!cursor && localProducts.length < 12) {
        return [...localProducts, ...otherProducts];
      }
      
      // If loading more products, return non-local products
      if (cursor) {
        return otherProducts;
      }

      // Initial load with enough local products
      return localProducts;
    }

    // No location, return all products sorted by date
    return sortedProducts;
  } catch (error) {

    // For prepared statement errors, retry with a new connection
    if (error instanceof Error && error.message.includes('prepared statement')) {
      try {
        // Disconnect and reconnect to clear prepared statements
        const prisma = (await import('@/lib/db')).default;
        await prisma.$disconnect();
        await prisma.$connect();
        
        // Retry the query and transform products
        const retryProducts = await getProducts({
          limit: cursor ? 12 : 50,
          cursor,
          isActive: true,
          marketStandId: undefined,
        });

        // Transform products with distance calculation
        const productsWithDistance = retryProducts.map((product: ProductResponse) => {
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
        return [...productsWithDistance].sort((a, b) => {
          if (!userLocation) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          if (a.distance === null || b.distance === null) return 0;
          return a.distance - b.distance;
        }) as SerializedProduct[];
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        throw retryError;
      }
    }

    throw error;
  }
};
