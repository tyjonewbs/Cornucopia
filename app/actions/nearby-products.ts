'use server';

import { getProducts, type ProductResponse } from "./products";
import { handleDatabaseError } from "@/lib/error-handler";

export interface SerializedNearbyProduct extends ProductResponse {
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
  availableAt: Array<{
    id: string;
    name: string;
    distance: number | null;
    locationName: string;
  }>;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export const getNearbyProducts = async (
  currentProductId: string,
  referenceLatitude: number,
  referenceLongitude: number
): Promise<SerializedNearbyProduct[]> => {
  try {
    // Fetch products excluding the current one
    const products = await getProducts({
      limit: 50,
      isActive: true,
      marketStandId: undefined,
    });

    // Filter out current product and calculate distances
    const productsWithDistance = products
      .filter((product: ProductResponse) => product.id !== currentProductId)
      .map((product: ProductResponse) => {
        // Collect all market stands where this product is available
        const allMarketStands: Array<{
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          locationName: string;
          isPrimary: boolean;
        }> = [];

        // Add primary market stand if it exists
        if (product.marketStand?.latitude && product.marketStand?.longitude) {
          allMarketStands.push({
            id: product.marketStand.id,
            name: product.marketStand.name,
            latitude: product.marketStand.latitude,
            longitude: product.marketStand.longitude,
            locationName: product.marketStand.locationName || product.marketStand.name,
            isPrimary: true,
          });
        }

        // Add stand listings (cross-listings) if they exist
        if ((product as any).standListings) {
          const listings = (product as any).standListings as Array<{
            isActive: boolean;
            marketStand?: {
              id: string;
              name: string;
              latitude: number;
              longitude: number;
              locationName: string;
            };
          }>;

          listings.forEach((listing) => {
            if (listing.isActive && listing.marketStand) {
              const stand = listing.marketStand;
              const exists = allMarketStands.some(s => s.id === stand.id);
              if (!exists) {
                allMarketStands.push({
                  id: stand.id,
                  name: stand.name,
                  latitude: stand.latitude,
                  longitude: stand.longitude,
                  locationName: stand.locationName || stand.name,
                  isPrimary: false,
                });
              }
            }
          });
        }

        // Calculate distance for each market stand from the reference point
        const availableAt = allMarketStands.map(stand => {
          const distance = calculateDistance(
            referenceLatitude,
            referenceLongitude,
            stand.latitude,
            stand.longitude
          );

          return {
            id: stand.id,
            name: stand.name,
            distance,
            locationName: stand.locationName,
          };
        });

        // Sort by distance (closest first)
        availableAt.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        // Calculate primary stand distance
        const primaryDistance = product.marketStand?.latitude && product.marketStand?.longitude
          ? calculateDistance(
              referenceLatitude,
              referenceLongitude,
              product.marketStand.latitude,
              product.marketStand.longitude
            )
          : null;

        return {
          ...product,
          distance: primaryDistance,
          availableAt,
        };
      });

    // Sort by distance and return top 3
    const sortedProducts = productsWithDistance
      .filter(p => p.distance !== null)
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      })
      .slice(0, 3) as SerializedNearbyProduct[];

    return sortedProducts;
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to fetch nearby products", {
      currentProductId,
      referenceLatitude,
      referenceLongitude,
    });
    
    console.error('Error fetching nearby products:', errorData);
    return [];
  }
};
