import prisma, { withTransaction } from "@/lib/db";
import { Status } from "@prisma/client";
import { serializeMarketStand, serializeMarketStands } from "@/lib/serializers";
import { MarketStandDTO, MarketStandQueryFilters, WeeklyHours } from "@/lib/dto/marketStand.dto";
import {
  cacheAside,
  generateCacheKey,
  CACHE_KEYS,
  CACHE_TTL,
  invalidateMarketStandCaches,
} from "@/lib/cache/redis";

/**
 * Market Stand Repository - Handles all database operations for market stands
 * Follows the Repository pattern to abstract data access logic
 */
export class MarketStandRepository {
  /**
   * Find market stands with optional filtering
   * Implements caching for frequently accessed market stand listings
   */
  async findMany(filters: MarketStandQueryFilters): Promise<MarketStandDTO[]> {
    const {
      userId,
      limit = 50,
      cursor,
      isActive = true,
    } = filters;

    // Generate cache key based on filters
    const cacheKeyPrefix = userId
      ? CACHE_KEYS.MARKET_STANDS_BY_USER
      : CACHE_KEYS.MARKET_STANDS_LIST;

    const cacheKey = generateCacheKey(
      cacheKeyPrefix,
      userId || 'all',
      isActive,
      limit,
      cursor || 'start'
    );

    return cacheAside(cacheKey, CACHE_TTL.MARKET_STAND_DATA, async () => {
      const marketStands = await prisma.marketStand.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          isActive,
          ...(userId && { userId }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return serializeMarketStands(marketStands);
    });
  }

  /**
   * Find market stands by location (within radius)
   * Implements caching for location-based queries
   */
  async findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters: Omit<MarketStandQueryFilters, 'latitude' | 'longitude' | 'radiusKm'> = {}
  ): Promise<MarketStandDTO[]> {
    const { limit = 50, isActive = true } = filters;

    // Generate cache key for location-based query (rounded to reduce cache variations)
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;
    const cacheKey = generateCacheKey(
      CACHE_KEYS.MARKET_STANDS_BY_LOCATION,
      roundedLat,
      roundedLng,
      radiusKm,
      isActive,
      limit
    );

    return cacheAside(cacheKey, CACHE_TTL.MARKET_STAND_DATA, async () => {
      // Calculate approximate lat/lng bounds (rough approximation)
      // 1 degree of latitude ≈ 111 km
      // 1 degree of longitude ≈ 111 km * cos(latitude)
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

      const marketStands = await prisma.marketStand.findMany({
        take: limit,
        where: {
          isActive,
          latitude: {
            gte: latitude - latDelta,
            lte: latitude + latDelta,
          },
          longitude: {
            gte: longitude - lngDelta,
            lte: longitude + lngDelta,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return serializeMarketStands(marketStands);
    });
  }

  /**
   * Find a single market stand by ID
   * Implements caching for individual market stand lookups
   */
  async findById(id: string): Promise<MarketStandDTO | null> {
    const cacheKey = generateCacheKey(CACHE_KEYS.MARKET_STAND, id);

    return cacheAside(cacheKey, CACHE_TTL.MARKET_STAND_DATA, async () => {
      const marketStand = await prisma.marketStand.findUnique({
        where: { id },
      });

      if (!marketStand) return null;

      return serializeMarketStand(marketStand);
    });
  }

  /**
   * Find market stand by ID for a specific user (ownership check)
   */
  async findByIdAndUserId(id: string, userId: string): Promise<MarketStandDTO | null> {
    const marketStand = await prisma.marketStand.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!marketStand) return null;

    return serializeMarketStand(marketStand);
  }

  /**
   * Create a new market stand
   * Invalidates relevant caches after creation
   */
  async create(data: {
    userId: string;
    name: string;
    description: string;
    locationName: string;
    locationGuide: string;
    latitude: number;
    longitude: number;
    website?: string | null;
    images: string[];
    tags: string[];
    socialMedia: string[];
    hours: WeeklyHours;
    status: Status;
    isActive: boolean;
  }): Promise<MarketStandDTO> {
    const marketStand = await withTransaction(async (tx) => {
      return tx.marketStand.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description,
          locationName: data.locationName,
          locationGuide: data.locationGuide,
          latitude: data.latitude,
          longitude: data.longitude,
          website: data.website || null,
          images: data.images,
          tags: data.tags,
          socialMedia: data.socialMedia,
          hours: data.hours as any,
          status: data.status,
          isActive: data.isActive,
        },
      });
    });

    // Invalidate caches asynchronously
    invalidateMarketStandCaches().catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeMarketStand(marketStand);
  }

  /**
   * Update an existing market stand
   * Invalidates relevant caches after update
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      locationName: string;
      locationGuide: string;
      latitude: number;
      longitude: number;
      website: string | null;
      images: string[];
      tags: string[];
      socialMedia: string[];
      hours: WeeklyHours;
      status: Status;
      isActive: boolean;
    }>
  ): Promise<MarketStandDTO> {
    const marketStand = await withTransaction(async (tx) => {
      // First verify the market stand exists
      const existing = await tx.marketStand.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Market stand not found');
      }

      return tx.marketStand.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.locationName !== undefined && { locationName: data.locationName }),
          ...(data.locationGuide !== undefined && { locationGuide: data.locationGuide }),
          ...(data.latitude !== undefined && { latitude: data.latitude }),
          ...(data.longitude !== undefined && { longitude: data.longitude }),
          ...(data.website !== undefined && { website: data.website }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.socialMedia !== undefined && { socialMedia: data.socialMedia }),
          ...(data.hours !== undefined && { hours: data.hours as any }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    });

    // Invalidate caches asynchronously
    invalidateMarketStandCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeMarketStand(marketStand);
  }

  /**
   * Delete a market stand
   * Invalidates relevant caches after deletion
   */
  async delete(id: string): Promise<void> {
    await prisma.marketStand.delete({
      where: { id },
    });

    // Invalidate caches asynchronously
    invalidateMarketStandCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });
  }

  /**
   * Check if a market stand exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.marketStand.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Count market stands with optional filters
   */
  async count(filters: Omit<MarketStandQueryFilters, 'limit' | 'cursor'>): Promise<number> {
    const { userId, isActive = true } = filters;

    return await prisma.marketStand.count({
      where: {
        isActive,
        ...(userId && { userId }),
      },
    });
  }

  /**
   * Update market stand status
   * Invalidates relevant caches after update
   */
  async updateStatus(id: string, status: Status): Promise<MarketStandDTO> {
    const marketStand = await prisma.marketStand.update({
      where: { id },
      data: {
        status,
      },
    });

    // Invalidate caches asynchronously
    invalidateMarketStandCaches(id).catch(err => {
      console.error('Cache invalidation error:', err);
    });

    return serializeMarketStand(marketStand);
  }

  /**
   * Get market stands by user ID
   */
  async findByUserId(userId: string): Promise<MarketStandDTO[]> {
    const marketStands = await prisma.marketStand.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return serializeMarketStands(marketStands);
  }
}

// Export singleton instance
export const marketStandRepository = new MarketStandRepository();
