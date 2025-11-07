'use server';

import { getProducts, type ProductResponse } from "./products";
import { handleDatabaseError } from "@/lib/error-handler";
import { getProductAvailability } from "@/types/product";

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
  availableAt: Array<{
    id: string;
    name: string;
    distance: number | null;
    locationName: string;
  }>;
  deliveryInfo: {
    isAvailable: boolean;
    deliveryFee: number | null;
    zoneName: string | null;
    zoneId: string | null;
    minimumOrder: number | null;
    freeDeliveryThreshold: number | null;
  } | null;
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
            // Avoid duplicates (if stand is both primary and listed)
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

      // Calculate distance for each market stand
      const availableAt = allMarketStands.map(stand => {
        const distance = userLocation
          ? calculateDistance(
              userLocation.coords.lat,
              userLocation.coords.lng,
              stand.latitude,
              stand.longitude
            )
          : null;

        return {
          id: stand.id,
          name: stand.name,
          distance,
          locationName: stand.locationName,
        };
      });

      // Sort by distance (closest first) if location is available
      if (userLocation) {
        availableAt.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }

      // Calculate primary stand distance for backward compatibility
      const primaryDistance = product.marketStand?.latitude && product.marketStand?.longitude && userLocation
        ? calculateDistance(
            userLocation.coords.lat,
            userLocation.coords.lng,
            product.marketStand.latitude,
            product.marketStand.longitude
          )
        : null;

      // Check delivery availability to user's location
      let deliveryInfo: SerializedProduct['deliveryInfo'] = null;
      if (product.deliveryAvailable && (product as any).deliveryZone && userLocation) {
        const zone = (product as any).deliveryZone;
        
        // For now, we'll mark as available since we don't have zip code from coordinates
        // In a real implementation, we'd geocode the coordinates to get zip/city
        // or require zip code input from user
        deliveryInfo = {
          isAvailable: true, // Simplified - would need proper zip/city matching
          deliveryFee: zone.deliveryFee || null,
          zoneName: zone.name || null,
          zoneId: zone.id || null,
          minimumOrder: zone.minimumOrder || null,
          freeDeliveryThreshold: zone.freeDeliveryThreshold || null,
        };
      }

      return {
        ...product,
        distance: primaryDistance,
        availableAt,
        deliveryInfo,
      };
    });

    // Sort by availability first, then by distance or date
    const sortedProducts = [...productsWithDistance].sort((a, b) => {
      // Helper to calculate availability priority for a product
      const getAvailabilityPriority = (product: typeof a) => {
        const now = new Date();
        const availableDate = product.availableDate ? new Date(product.availableDate) : null;
        const availableUntil = product.availableUntil ? new Date(product.availableUntil) : null;
        
        const isAvailableNow = 
          (!availableDate || availableDate <= now) && 
          (!availableUntil || availableUntil >= now);
        
        const isPreOrder = availableDate ? availableDate > now : false;
        
        // Priority order: Available Now (1) > Pre-Order (2) > Other (3)
        if (isAvailableNow) return 1;
        if (isPreOrder) return 2;
        return 3;
      };
      
      const priorityA = getAvailabilityPriority(a);
      const priorityB = getAvailabilityPriority(b);
      
      // First sort by availability priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same priority, sort by distance (if location available) or by date
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
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Failed to fetch home products", {
      hasLocation: !!userLocation,
      locationSource: userLocation?.source,
      cursor
    });
    
    console.error('Error fetching home products:', errorData);
    return [];
  }
};
