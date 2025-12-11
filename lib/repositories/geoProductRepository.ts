import prisma, { executeWithRetry, monitoredQuery } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  cacheAside,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
} from "@/lib/cache/redis";

/**
 * Result type from the PostGIS get_home_products function
 */
export interface GeoProductResult {
  product_id: string;
  product_name: string;
  product_description: string | null;
  product_price: number;
  product_images: string[];
  product_inventory: number;
  product_tags: string[];
  product_is_active: boolean;
  product_delivery_available: boolean;
  product_available_date: Date | null;
  product_available_until: Date | null;
  product_created_at: Date;
  product_updated_at: Date;
  market_stand_id: string | null;
  market_stand_name: string | null;
  market_stand_location_name: string | null;
  market_stand_latitude: number | null;
  market_stand_longitude: number | null;
  distance_km: number | null;
  has_delivery_to_zip: boolean;
  delivery_zone_id: string | null;
  delivery_fee: number | null;
}

/**
 * Serialized product format matching existing SerializedProduct interface
 */
export interface GeoSerializedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  inventory: number;
  tags: string[];
  isActive: boolean;
  deliveryAvailable: boolean;
  availableDate: string | null;
  availableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  marketStand: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    locationName: string;
  } | null;
  distance: number | null;
  deliveryInfo: {
    isAvailable: boolean;
    deliveryFee: number | null;
    zoneName: string | null;
    zoneId: string | null;
    minimumOrder: number | null;
    freeDeliveryThreshold: number | null;
    deliveryDays?: string[];
  } | null;
}

/**
 * Parameters for geo product queries
 */
export interface GeoProductQueryParams {
  lat?: number | null;
  lng?: number | null;
  zipCode?: string | null;
  radiusKm?: number;
  limit?: number;
}

/**
 * Geo Product Repository - Uses PostGIS for efficient location-based queries
 *
 * This repository leverages the PostGIS extension for:
 * - Fast spatial indexing (GIST indexes)
 * - Efficient distance calculations at the database level
 * - Combined geo + delivery zone filtering in a single query
 */
export class GeoProductRepository {
  /**
   * Get products near a location and/or with delivery to a zip code
   * Uses the PostGIS get_home_products function for efficient filtering
   */
  async getHomeProducts(params: GeoProductQueryParams): Promise<GeoSerializedProduct[]> {
    const {
      lat = null,
      lng = null,
      zipCode = null,
      radiusKm = 250, // Default ~155 miles
      limit = 20,
    } = params;

    // Generate cache key including location bucket for nearby users
    const locationBucket = lat && lng
      ? `${Math.floor(lat * 10) / 10}_${Math.floor(lng * 10) / 10}` // ~11km buckets
      : 'no-location';

    const cacheKey = generateCacheKey(
      CACHE_KEYS.PRODUCTS_LIST,
      'geo',
      locationBucket,
      zipCode || 'no-zip',
      radiusKm,
      limit
    );

    return cacheAside(cacheKey, CACHE_TTL.PRODUCT_LISTING, async () => {
      return monitoredQuery('get_home_products', async () => {
        const results = await executeWithRetry(() =>
          prisma.$queryRaw<GeoProductResult[]>`
            SELECT * FROM get_home_products(
              ${lat}::DOUBLE PRECISION,
              ${lng}::DOUBLE PRECISION,
              ${zipCode}::VARCHAR,
              ${radiusKm}::DOUBLE PRECISION,
              ${limit}::INTEGER
            )
          `
        );

        return this.serializeResults(results);
      });
    });
  }

  /**
   * Get products within a specific radius (without delivery zone check)
   * Useful for "nearby products" section
   */
  async getProductsWithinRadius(
    lat: number,
    lng: number,
    radiusKm: number = 250,
    limit: number = 20
  ): Promise<GeoSerializedProduct[]> {
    const locationBucket = `${Math.floor(lat * 10) / 10}_${Math.floor(lng * 10) / 10}`;

    const cacheKey = generateCacheKey(
      CACHE_KEYS.PRODUCTS_LIST,
      'radius',
      locationBucket,
      radiusKm,
      limit
    );

    return cacheAside(cacheKey, CACHE_TTL.PRODUCT_LISTING, async () => {
      return monitoredQuery('get_products_within_radius', async () => {
        const results = await executeWithRetry(() =>
          prisma.$queryRaw<GeoProductResult[]>`
            SELECT * FROM get_products_within_radius(
              ${lat}::DOUBLE PRECISION,
              ${lng}::DOUBLE PRECISION,
              ${radiusKm}::DOUBLE PRECISION,
              ${limit}::INTEGER,
              NULL::TEXT
            )
          `
        );

        return this.serializeResults(results);
      });
    });
  }

  /**
   * Get products that deliver to a specific zip code
   */
  async getProductsDeliveringToZip(
    zipCode: string,
    limit: number = 20
  ): Promise<GeoSerializedProduct[]> {
    const cacheKey = generateCacheKey(
      CACHE_KEYS.PRODUCTS_LIST,
      'delivery',
      zipCode,
      limit
    );

    return cacheAside(cacheKey, CACHE_TTL.PRODUCT_LISTING, async () => {
      return monitoredQuery('get_products_with_delivery_to_zip', async () => {
        // For delivery-only products, we need a slightly different query
        // since get_products_with_delivery_to_zip returns minimal data
        const results = await executeWithRetry(() =>
          prisma.$queryRaw<GeoProductResult[]>`
            SELECT * FROM get_home_products(
              NULL::DOUBLE PRECISION,
              NULL::DOUBLE PRECISION,
              ${zipCode}::VARCHAR,
              0::DOUBLE PRECISION,
              ${limit}::INTEGER
            )
          `
        );

        return this.serializeResults(results);
      });
    });
  }

  /**
   * Convert raw PostGIS results to serialized product format
   */
  private serializeResults(results: GeoProductResult[]): GeoSerializedProduct[] {
    return results.map(row => ({
      id: row.product_id,
      name: row.product_name,
      description: row.product_description,
      price: Number(row.product_price),
      images: row.product_images || [],
      inventory: row.product_inventory,
      tags: row.product_tags || [],
      isActive: row.product_is_active,
      deliveryAvailable: row.product_delivery_available,
      availableDate: row.product_available_date?.toISOString() || null,
      availableUntil: row.product_available_until?.toISOString() || null,
      createdAt: row.product_created_at.toISOString(),
      updatedAt: row.product_updated_at.toISOString(),
      marketStand: row.market_stand_id ? {
        id: row.market_stand_id,
        name: row.market_stand_name || '',
        latitude: row.market_stand_latitude || 0,
        longitude: row.market_stand_longitude || 0,
        locationName: row.market_stand_location_name || '',
      } : null,
      distance: row.distance_km,
      deliveryInfo: row.has_delivery_to_zip ? {
        isAvailable: true,
        deliveryFee: row.delivery_fee ? Number(row.delivery_fee) : null,
        zoneName: null, // Would need to join to get this
        zoneId: row.delivery_zone_id,
        minimumOrder: null,
        freeDeliveryThreshold: null,
        deliveryDays: undefined,
      } : null,
    }));
  }

  /**
   * Check if PostGIS is available
   * Call this on startup to verify the extension is enabled
   */
  async isPostGISAvailable(): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<[{ postgis_version: string }]>`
        SELECT PostGIS_Version() as postgis_version
      `;
      console.log('PostGIS version:', result[0]?.postgis_version);
      return true;
    } catch (error) {
      console.warn('PostGIS is not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const geoProductRepository = new GeoProductRepository();
