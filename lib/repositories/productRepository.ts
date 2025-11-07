import prisma, { executeWithRetry } from "@/lib/db";
import { Prisma, Status, DeliveryType } from "@prisma/client";
import { serializeProduct, serializeProducts } from "@/lib/serializers";
import { ProductWithMarketStandDTO, ProductQueryFilters } from "@/lib/dto/product.dto";
import {
  cacheAside,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
  invalidateProductCaches,
} from "@/lib/cache/redis";

/**
 * Product Repository - Handles all database operations for products
 * Follows the Repository pattern to abstract data access logic
 */
export class ProductRepository {
  /**
   * Find products with optional filtering
   * Implements caching for frequently accessed product listings
   */
  async findMany(filters: ProductQueryFilters): Promise<ProductWithMarketStandDTO[]> {
    const {
      userId,
      marketStandId,
      limit = 50,
      cursor,
      isActive = true,
    } = filters;

    // Generate cache key based on filters
    const cacheKeyPrefix = marketStandId
      ? CACHE_KEYS.PRODUCTS_BY_STAND
      : userId
      ? CACHE_KEYS.PRODUCTS_BY_USER
      : CACHE_KEYS.PRODUCTS_LIST;

    const cacheKey = generateCacheKey(
      cacheKeyPrefix,
      userId || 'all',
      marketStandId || 'all',
      isActive,
      limit,
      cursor || 'start'
    );

    return cacheAside(cacheKey, CACHE_TTL.PRODUCT_LISTING, async () => {
      const products = await executeWithRetry(() => 
        prisma.product.findMany({
          take: limit,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          where: {
            isActive,
            ...(userId && { userId }),
            ...(marketStandId && { marketStandId }),
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            marketStand: {
              select: {
                id: true,
                name: true,
                locationName: true,
                latitude: true,
                longitude: true,
              },
            },
            standListings: {
              where: { isActive: true },
              include: {
                marketStand: {
                  select: {
                    id: true,
                    name: true,
                    locationName: true,
                    latitude: true,
                    longitude: true,
                  },
                },
              },
            },
            deliveryZone: {
              select: {
                id: true,
                name: true,
                deliveryFee: true,
                minimumOrder: true,
                freeDeliveryThreshold: true,
                zipCodes: true,
                cities: true,
                states: true,
              },
            },
          },
        })
      );

      return serializeProducts(products);
    });
  }

  /**
   * Find a single product by ID
   * Implements caching for individual product lookups
   */
  async findById(id: string): Promise<ProductWithMarketStandDTO | null> {
    const cacheKey = generateCacheKey(CACHE_KEYS.PRODUCT, id);

    return cacheAside(cacheKey, CACHE_TTL.PRODUCT_LISTING, async () => {
      const product = await executeWithRetry(() =>
        prisma.product.findUnique({
          where: { id },
          include: {
            marketStand: {
              select: {
                id: true,
                name: true,
                locationName: true,
                latitude: true,
                longitude: true,
              },
            },
            standListings: {
              where: { isActive: true },
              include: {
                marketStand: {
                  select: {
                    id: true,
                    name: true,
                    locationName: true,
                    latitude: true,
                    longitude: true,
                  },
                },
              },
            },
            deliveryZone: {
              select: {
                id: true,
                name: true,
                deliveryFee: true,
                minimumOrder: true,
                freeDeliveryThreshold: true,
                zipCodes: true,
                cities: true,
                states: true,
              },
            },
          },
        })
      );

      if (!product) return null;

      return serializeProduct(product);
    });
  }

  /**
   * Find product by ID for a specific user (ownership check)
   */
  async findByIdAndUserId(id: string, userId: string): Promise<ProductWithMarketStandDTO | null> {
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!product) return null;

    return serializeProduct(product);
  }

  /**
   * Create a new product
   * Invalidates relevant caches after creation
   */
  async create(data: {
    name: string;
    description: string;
    price: number;
    images: string[];
    inventory: number;
    inventoryUpdatedAt?: Date | null;
    status: Status;
    isActive: boolean;
    userId: string;
    marketStandId?: string | null;
    deliveryAvailable?: boolean;
    deliveryZoneId?: string | null;
    deliveryType?: DeliveryType | null;
    tags: string[];
  }): Promise<ProductWithMarketStandDTO> {
    // Automatically set deliveryType to RECURRING if delivery is enabled
    const productData = {
      ...data,
      deliveryType: data.deliveryAvailable 
        ? (data.deliveryType || DeliveryType.RECURRING) 
        : data.deliveryType,
    };

    const product = await prisma.product.create({
      data: productData,
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
            minimumOrder: true,
            freeDeliveryThreshold: true,
            zipCodes: true,
            cities: true,
            states: true,
          },
        },
      },
    });

    // Invalidate caches asynchronously
    invalidateProductCaches().catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeProduct(product);
  }

  /**
   * Update an existing product
   * Invalidates relevant caches after update
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      images: string[];
      inventory: number;
      inventoryUpdatedAt: Date | null;
      status: Status;
      isActive: boolean;
      deliveryAvailable: boolean;
      deliveryZoneId: string | null;
      deliveryType: DeliveryType | null;
      tags: string[];
    }>
  ): Promise<ProductWithMarketStandDTO> {
    // Automatically set deliveryType to RECURRING if delivery is being enabled
    const updateData: any = { ...data };
    if (data.deliveryAvailable && !data.deliveryType) {
      updateData.deliveryType = DeliveryType.RECURRING;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
            minimumOrder: true,
            freeDeliveryThreshold: true,
            zipCodes: true,
            cities: true,
            states: true,
          },
        },
      },
    });

    // Invalidate caches asynchronously
    invalidateProductCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeProduct(product);
  }

  /**
   * Delete a product
   * Invalidates relevant caches after deletion
   */
  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });

    // Invalidate caches asynchronously
    invalidateProductCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });
  }

  /**
   * Check if a product exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.product.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Count products with optional filters
   */
  async count(filters: Omit<ProductQueryFilters, 'limit' | 'cursor'>): Promise<number> {
    const { userId, marketStandId, isActive = true } = filters;

    return await prisma.product.count({
      where: {
        isActive,
        ...(userId && { userId }),
        ...(marketStandId && { marketStandId }),
      },
    });
  }

  /**
   * Update product inventory
   * Invalidates relevant caches after update
   */
  async updateInventory(id: string, inventory: number): Promise<ProductWithMarketStandDTO> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        inventory,
        inventoryUpdatedAt: new Date(),
      },
      include: {
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Invalidate caches asynchronously
    invalidateProductCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeProduct(product);
  }

  /**
   * Bulk update product status
   * Invalidates relevant caches after update
   */
  async bulkUpdateStatus(productIds: string[], status: Status): Promise<number> {
    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        status,
      },
    });

    // Invalidate caches asynchronously
    invalidateProductCaches().catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return result.count;
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
