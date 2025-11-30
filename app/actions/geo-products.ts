'use server';

import { geoProductRepository, type GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";
import { handleDatabaseError } from "@/lib/error-handler";
import {
  calculateProductBadge,
  type ProductBadge
} from "@/lib/utils/product-badges";

export interface LocationType {
  coords: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  };
  source: 'browser' | 'zipcode';
  zipCode?: string;
}

/**
 * SerializedProduct type compatible with the existing home-products.ts
 * This ensures the geo-filtered products work with existing components
 */
export interface SerializedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: string | null;
  status: string;
  userId: string;
  marketStandId: string | null;
  deliveryZoneId: string | null;
  tags: string[];
  isActive: boolean;
  deliveryAvailable: boolean;
  availableDate: string | null;
  availableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
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
  } | null;
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
    deliveryDays?: string[];
  } | null;
  badge: ProductBadge | null;
}

/**
 * Get home products using PostGIS geo-filtering
 *
 * This is the optimized version that performs filtering at the database level
 * instead of fetching all products and filtering in JavaScript.
 *
 * Drop-in replacement for getHomeProducts from home-products.ts
 */
export async function getHomeProducts(
  lat?: number | null,
  lng?: number | null,
  source?: 'browser' | 'zipcode' | null,
  zipCode?: string | null,
  accuracy?: number | null,
  timestamp?: number | null
): Promise<SerializedProduct[]> {
  try {
    // Determine radius based on location source
    // Zip codes are less precise, so use larger radius
    const radiusKm = source === 'zipcode' ? 320 : 250; // ~200 miles for zip, ~155 for browser

    // Call the geo repository which uses PostGIS
    const products = await geoProductRepository.getHomeProducts({
      lat,
      lng,
      zipCode,
      radiusKm,
      limit: 20,
    });

    // Transform to SerializedProduct format for compatibility
    const serializedProducts: SerializedProduct[] = products.map(product => {
      // Calculate badge
      const badge = calculateProductBadge({
        availableDate: product.availableDate,
        availableUntil: product.availableUntil,
        totalInventory: product.inventory,
        inventoryUpdatedAt: product.updatedAt,
        updatedAt: product.updatedAt,
        hasMarketStand: !!product.marketStand,
        hasDelivery: product.deliveryAvailable,
        isMarketStandOpen: undefined, // Would need hours data for this
        deliveryDays: product.deliveryInfo?.deliveryDays,
      });

      // Create availableAt array for compatibility
      const availableAt = product.marketStand ? [{
        id: product.marketStand.id,
        name: product.marketStand.name,
        distance: product.distance,
        locationName: product.marketStand.locationName,
      }] : [];

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images,
        inventory: product.inventory,
        inventoryUpdatedAt: product.updatedAt, // Use updatedAt as fallback
        status: 'ACTIVE', // Products from geo query are active
        userId: '', // Not available from geo query
        marketStandId: product.marketStand?.id || null,
        deliveryZoneId: product.deliveryInfo?.zoneId || null,
        tags: product.tags,
        isActive: product.isActive,
        deliveryAvailable: product.deliveryAvailable,
        availableDate: product.availableDate,
        availableUntil: product.availableUntil,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        totalReviews: 0, // Not available from geo query
        averageRating: null, // Not available from geo query
        distance: product.distance,
        marketStand: product.marketStand ? {
          id: product.marketStand.id,
          name: product.marketStand.name,
          latitude: product.marketStand.latitude,
          longitude: product.marketStand.longitude,
          locationName: product.marketStand.locationName,
          user: {
            firstName: '', // Not available from geo query
            profileImage: '',
          },
        } : null,
        availableAt,
        deliveryInfo: product.deliveryInfo,
        badge,
      };
    });

    return serializedProducts;
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to fetch geo products", {
      hasLocation: !!(lat && lng),
      locationSource: source || undefined,
      zipCode,
    });

    console.error('Error fetching geo products:', errorData);
    return [];
  }
}

/**
 * Check if PostGIS is available and the geo functions are set up
 * Call this to determine whether to use geo or legacy product fetching
 */
export async function isGeoFilteringAvailable(): Promise<boolean> {
  try {
    return await geoProductRepository.isPostGISAvailable();
  } catch {
    return false;
  }
}
