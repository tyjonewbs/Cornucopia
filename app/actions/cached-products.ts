'use server';

import { redis } from '@/lib/cache/redis';
import prisma from '@/lib/db';
import type { SerializedProduct } from './geo-products';

/**
 * Static/Fallback products cache key for instant loading
 * This cache is pre-populated and serves as fallback when geo queries timeout
 */
const STATIC_PRODUCTS_KEY = 'products:static:home';
const STATIC_PRODUCTS_TTL = 60 * 60; // 1 hour - refresh less frequently

/**
 * Get cached products for instant home page loading
 * 
 * Strategy:
 * 1. Try to get from Redis (sub-100ms response)
 * 2. If cache miss, fetch from DB and cache
 * 3. On cold starts, this can return data faster than geo queries
 */
export async function getCachedHomeProducts(): Promise<SerializedProduct[] | null> {
  try {
    const cached = await redis.get<SerializedProduct[]>(STATIC_PRODUCTS_KEY);
    return cached;
  } catch (error) {
    console.error('Error fetching cached products:', error);
    return null;
  }
}

/**
 * Pre-populate the static products cache
 * Call this from warm-up endpoint or cron job
 */
export async function refreshStaticProductsCache(): Promise<boolean> {
  try {
    // Fetch products without geo filtering - just active products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'APPROVED',
        marketStand: {
          status: 'APPROVED',
        },
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            locationName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Transform to SerializedProduct format
    const serializedProducts: SerializedProduct[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      images: product.images,
      inventory: product.inventory,
      inventoryUpdatedAt: product.updatedAt.toISOString(),
      status: product.status,
      userId: product.userId,
      marketStandId: product.marketStand?.id || null,
      deliveryZoneId: product.deliveryZoneId,
      tags: product.tags,
      isActive: product.isActive,
      deliveryAvailable: product.deliveryAvailable,
      availableDate: product.availableDate?.toISOString() || null,
      availableUntil: product.availableUntil?.toISOString() || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
      distance: null,
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude,
        locationName: product.marketStand.locationName || '',
        user: {
          firstName: '',
          profileImage: '',
        },
      } : null,
      availableAt: product.marketStand ? [{
        id: product.marketStand.id,
        name: product.marketStand.name,
        distance: null,
        locationName: product.marketStand.locationName || '',
      }] : [],
      deliveryInfo: null,
      badge: null,
    }));

    // Store in Redis
    await redis.setex(STATIC_PRODUCTS_KEY, STATIC_PRODUCTS_TTL, JSON.stringify(serializedProducts));
    
    console.log(`Refreshed static products cache with ${serializedProducts.length} products`);
    return true;
  } catch (error) {
    console.error('Error refreshing static products cache:', error);
    return false;
  }
}

/**
 * Get home products with fast fallback
 * 
 * This is the recommended function for the home page:
 * 1. Immediately returns cached products if available
 * 2. Falls back to simple DB query if cache miss
 * 3. Much faster than geo queries on cold starts
 */
export async function getFastHomeProducts(): Promise<SerializedProduct[]> {
  try {
    // Try cache first (sub-100ms)
    const cached = await getCachedHomeProducts();
    if (cached && cached.length > 0) {
      return cached;
    }

    // Cache miss - do a fast simple query (no PostGIS)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: 'APPROVED',
        marketStand: {
          status: 'APPROVED',
        },
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            locationName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Transform and return
    const serializedProducts: SerializedProduct[] = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      images: product.images,
      inventory: product.inventory,
      inventoryUpdatedAt: product.updatedAt.toISOString(),
      status: product.status,
      userId: product.userId,
      marketStandId: product.marketStand?.id || null,
      deliveryZoneId: product.deliveryZoneId,
      tags: product.tags,
      isActive: product.isActive,
      deliveryAvailable: product.deliveryAvailable,
      availableDate: product.availableDate?.toISOString() || null,
      availableUntil: product.availableUntil?.toISOString() || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      totalReviews: product.totalReviews,
      averageRating: product.averageRating,
      distance: null,
      marketStand: product.marketStand ? {
        id: product.marketStand.id,
        name: product.marketStand.name,
        latitude: product.marketStand.latitude,
        longitude: product.marketStand.longitude,
        locationName: product.marketStand.locationName || '',
        user: {
          firstName: '',
          profileImage: '',
        },
      } : null,
      availableAt: product.marketStand ? [{
        id: product.marketStand.id,
        name: product.marketStand.name,
        distance: null,
        locationName: product.marketStand.locationName || '',
      }] : [],
      deliveryInfo: null,
      badge: null,
    }));

    // Cache in background for next request
    redis.setex(STATIC_PRODUCTS_KEY, STATIC_PRODUCTS_TTL, JSON.stringify(serializedProducts)).catch(() => {});

    return serializedProducts;
  } catch (error) {
    console.error('Error in getFastHomeProducts:', error);
    return [];
  }
}
