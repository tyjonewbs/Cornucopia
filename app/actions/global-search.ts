'use server';

import { cache } from 'react';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import { geocodeZipCode } from './geocode';
import type { SerializedProduct } from './geo-products';
import { geoProductRepository } from "@/lib/repositories/geoProductRepository";
import { calculateProductBadge } from "@/lib/utils/product-badges";

export interface SearchResultProduct extends SerializedProduct {
  resultType: 'product';
}

export interface SearchResultMarketStand {
  resultType: 'market-stand';
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  images: string[];
  tags: string[];
  distance: number | null;
  href: string;
  _count?: {
    products: number;
  };
}

export interface SearchResultLocal {
  resultType: 'farm';
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  images: string[];
  distance: number | null;
  href: string;
  slug?: string;
  tagline?: string;
}

export type SearchResult = SearchResultProduct | SearchResultMarketStand | SearchResultLocal;

export interface GlobalSearchResults {
  products: SearchResultProduct[];
  marketStands: SearchResultMarketStand[];
  farms: SearchResultLocal[];
  location: {
    lat: number;
    lng: number;
    zipCode: string;
  } | null;
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Global search that returns products, market stands, and farms all sorted by distance
 * @param zipCode - The zip code to search near
 * @param searchQuery - Optional text query to filter results by name/description
 */
export const globalSearch = cache(async (zipCode: string, searchQuery: string = ''): Promise<GlobalSearchResults> => {
  try {
    // First, geocode the zip code to get coordinates
    const location = await geocodeZipCode(zipCode);
    
    if (!location) {
      return {
        products: [],
        marketStands: [],
        farms: [],
        location: null,
      };
    }

    const { lat, lng } = location;
    const radiusKm = 320; // ~200 miles

    // Fetch products using the existing geo repository
    const geoProducts = await geoProductRepository.getHomeProducts({
      lat,
      lng,
      zipCode,
      radiusKm,
      limit: 50, // Get more results for search
    });

    // Transform products to search results
    const products: SearchResultProduct[] = geoProducts.map(product => {
      const badge = calculateProductBadge({
        availableDate: product.availableDate,
        availableUntil: product.availableUntil,
        totalInventory: product.inventory,
        inventoryUpdatedAt: product.updatedAt,
        updatedAt: product.updatedAt,
        hasMarketStand: !!product.marketStand,
        hasDelivery: product.deliveryAvailable,
        isMarketStandOpen: undefined,
        deliveryDays: product.deliveryInfo?.deliveryDays,
      });

      const availableAt = product.marketStand ? [{
        id: product.marketStand.id,
        name: product.marketStand.name,
        distance: product.distance,
        locationName: product.marketStand.locationName,
      }] : [];

      return {
        resultType: 'product',
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images,
        inventory: product.inventory,
        inventoryUpdatedAt: product.updatedAt,
        status: 'ACTIVE',
        userId: '',
        marketStandId: product.marketStand?.id || null,
        deliveryZoneId: product.deliveryInfo?.zoneId || null,
        tags: product.tags,
        isActive: product.isActive,
        deliveryAvailable: product.deliveryAvailable,
        availableDate: product.availableDate,
        availableUntil: product.availableUntil,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        totalReviews: 0,
        averageRating: null,
        distance: product.distance,
        locationName: product.marketStand?.locationName || '',
        marketStand: product.marketStand ? {
          id: product.marketStand.id,
          name: product.marketStand.name,
          latitude: product.marketStand.latitude,
          longitude: product.marketStand.longitude,
          locationName: product.marketStand.locationName,
          user: {
            firstName: '',
            profileImage: '',
          },
        } : null,
        availableAt,
        deliveryInfo: product.deliveryInfo,
        badge,
      };
    });

    // Fetch market stands within radius
    const marketStandsData = await db.marketStand.findMany({
      where: {
        isActive: true,
        status: 'APPROVED'
      },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        locationName: true,
        locationGuide: true,
        images: true,
        tags: true,
        _count: {
          select: {
            products: true,
          }
        }
      }
    });

    // Calculate distance for market stands and filter
    const marketStands: SearchResultMarketStand[] = marketStandsData
      .map(stand => ({
        resultType: 'market-stand' as const,
        id: stand.id,
        name: stand.name,
        description: stand.description,
        latitude: stand.latitude,
        longitude: stand.longitude,
        locationName: stand.locationName,
        locationGuide: stand.locationGuide,
        images: stand.images || [],
        tags: stand.tags,
        distance: calculateDistance(lat, lng, stand.latitude, stand.longitude),
        href: `/market-stand/${stand.id}`,
        _count: stand._count,
      }))
      .filter(stand => stand.distance !== null && stand.distance <= radiusKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Fetch farms (locals) within radius
    const localsData = await db.local.findMany({
      where: {
        isActive: true,
        status: 'APPROVED'
      },
    });

    // Calculate distance for farms and filter
    const farms: SearchResultLocal[] = localsData
      .map(local => {
        const localAny = local as any;
        return {
          resultType: 'farm' as const,
          id: local.id,
          name: local.name,
          description: localAny.tagline || local.description,
          latitude: local.latitude,
          longitude: local.longitude,
          locationName: local.locationName,
          images: local.images || [],
          distance: calculateDistance(lat, lng, local.latitude, local.longitude),
          href: localAny.slug ? `/local/${localAny.slug}` : `/local/${local.id}`,
          slug: localAny.slug,
          tagline: localAny.tagline,
        };
      })
      .filter(farm => farm.distance !== null && farm.distance <= radiusKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Apply text search filter if query provided
    const queryLower = searchQuery.toLowerCase().trim();
    
    const filteredProducts = queryLower
      ? products.filter(p => 
          p.name.toLowerCase().includes(queryLower) ||
          p.description?.toLowerCase().includes(queryLower) ||
          p.tags.some(t => t.toLowerCase().includes(queryLower)) ||
          p.marketStand?.name.toLowerCase().includes(queryLower)
        )
      : products;

    const filteredMarketStands = queryLower
      ? marketStands.filter(s => 
          s.name.toLowerCase().includes(queryLower) ||
          s.description?.toLowerCase().includes(queryLower) ||
          s.tags.some(t => t.toLowerCase().includes(queryLower)) ||
          s.locationName.toLowerCase().includes(queryLower)
        )
      : marketStands;

    const filteredFarms = queryLower
      ? farms.filter(f => 
          f.name.toLowerCase().includes(queryLower) ||
          f.description?.toLowerCase().includes(queryLower) ||
          f.tagline?.toLowerCase().includes(queryLower) ||
          f.locationName.toLowerCase().includes(queryLower)
        )
      : farms;

    return {
      products: filteredProducts,
      marketStands: filteredMarketStands,
      farms: filteredFarms,
      location: {
        lat,
        lng,
        zipCode,
      },
    };
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to perform global search", {
      zipCode,
    });

    console.error('Error performing global search:', errorData);
    
    return {
      products: [],
      marketStands: [],
      farms: [],
      location: null,
    };
  }
});
