'use server';

import { cache } from 'react';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import { geoProductRepository } from "@/lib/repositories/geoProductRepository";
import type { GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";

interface MarketStand {
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
  _count?: {
    products: number;
  };
}

interface Farm {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  images: string[];
  distance: number | null;
  slug?: string;
  tagline?: string;
  _count: {
    products: number;
  };
}

export interface HomePageData {
  products: GeoSerializedProduct[];
  stands: MarketStand[];
  farms: Farm[];
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
 * Fetch all data for the home page - products, market stands, and farms
 */
export const getHomePageData = cache(async (
  lat?: number,
  lng?: number,
  zipCode?: string,
  radiusKm: number = 160.934 // ~100 miles
): Promise<HomePageData> => {
  try {
    // Fetch products using existing geo repository
    const products = await geoProductRepository.getHomeProducts({
      lat,
      lng,
      zipCode,
      radiusKm,
      limit: 50,
    });

    let stands: MarketStand[] = [];
    let farms: Farm[] = [];

    // If we have location, fetch nearby stands and farms
    if (lat && lng) {
      // Fetch market stands
      const standsData = await db.marketStand.findMany({
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
        },
        take: 10, // Limit for performance
      });

      // Calculate distance and filter
      stands = standsData
        .map(stand => ({
          ...stand,
          images: stand.images || [],
          distance: calculateDistance(lat, lng, stand.latitude, stand.longitude),
        }))
        .filter(stand => stand.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5); // Take top 5 closest

      // Fetch farms
      const farmsData = await db.local.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        take: 10, // Limit for performance
      });

      // Calculate distance and filter
      farms = farmsData
        .map(farm => {
          const farmAny = farm as any;
          return {
            id: farm.id,
            name: farm.name,
            description: farm.description,
            latitude: farm.latitude,
            longitude: farm.longitude,
            locationName: farm.locationName,
            images: farm.images || [],
            distance: calculateDistance(lat, lng, farm.latitude, farm.longitude),
            slug: farmAny.slug,
            tagline: farmAny.tagline,
            _count: {
              products: 0, // TODO: Count products from this farm
            },
          };
        })
        .filter(farm => farm.distance! <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5); // Take top 5 closest
    } else {
      // No location - fetch some featured stands and farms
      const standsData = await db.marketStand.findMany({
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
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      stands = standsData.map(stand => ({
        ...stand,
        images: stand.images || [],
        distance: null,
      }));

      const farmsData = await db.local.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      farms = farmsData.map(farm => {
        const farmAny = farm as any;
        return {
          id: farm.id,
          name: farm.name,
          description: farm.description,
          latitude: farm.latitude,
          longitude: farm.longitude,
          locationName: farm.locationName,
          images: farm.images || [],
          distance: null,
          slug: farmAny.slug,
          tagline: farmAny.tagline,
          _count: {
            products: 0,
          },
        };
      });
    }

    return {
      products,
      stands,
      farms,
    };
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to fetch home page data", {
      lat,
      lng,
      zipCode,
    });

    console.error('Error fetching home page data:', errorData);
    
    return {
      products: [],
      stands: [],
      farms: [],
    };
  }
});
