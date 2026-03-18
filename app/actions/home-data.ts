'use server';

import { cache } from 'react';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import { geoProductRepository } from "@/lib/repositories/geoProductRepository";
import type { GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";
import type { MarketStandTileData } from "@/components/tiles/MarketStandTile";
import type { EventTileData } from "@/components/tiles/EventTile";
import type { DeliveryTileData } from "@/components/tiles/DeliveryTile";

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
  stands: MarketStandTileData[];
  farms: Farm[];
  events: EventTileData[];
  deliveryZones: DeliveryTileData[];
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
 * Fetch all data for the home page - products, market stands, farms, events, and delivery zones
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

    let stands: MarketStandTileData[] = [];
    let farms: Farm[] = [];
    let events: EventTileData[] = [];
    let deliveryZones: DeliveryTileData[] = [];

    // Common select for market stands (includes hours + rating for tiles)
    const standSelect = {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      locationName: true,
      locationGuide: true,
      images: true,
      tags: true,
      hours: true,
      averageRating: true,
      totalReviews: true,
      _count: {
        select: {
          products: true,
        }
      }
    } as const;

    // If we have location, fetch nearby stands, farms, events, and delivery zones
    if (lat && lng) {
      // Fetch market stands
      const standsData = await db.marketStand.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        select: standSelect,
        take: 10,
      });

      stands = standsData
        .map(stand => ({
          ...stand,
          images: stand.images || [],
          hours: stand.hours as MarketStandTileData['hours'],
          distance: calculateDistance(lat, lng, stand.latitude, stand.longitude),
        }))
        .filter(stand => stand.distance! <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);

      // Fetch farms
      const farmsData = await db.local.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        take: 10,
      });

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
              products: 0,
            },
          };
        })
        .filter(farm => farm.distance! <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);

      // Fetch upcoming events nearby
      const now = new Date();
      const eventsData = await db.event.findMany({
        where: {
          isActive: true,
          status: 'APPROVED',
          endDate: { gte: now },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          images: true,
          tags: true,
          eventType: true,
          startDate: true,
          endDate: true,
          isRecurring: true,
          locationName: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
          maxVendors: true,
          maxAttendees: true,
          isVendorApplicationOpen: true,
          _count: {
            select: {
              vendors: true,
            }
          }
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 10,
      });

      events = eventsData
        .map(event => ({
          id: event.id,
          name: event.name,
          slug: event.slug,
          shortDescription: event.shortDescription,
          description: event.description,
          images: event.images || [],
          tags: event.tags || [],
          eventType: event.eventType as EventTileData['eventType'],
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          isRecurring: event.isRecurring,
          locationName: event.locationName,
          city: event.city,
          state: event.state,
          maxVendors: event.maxVendors,
          maxAttendees: event.maxAttendees,
          isVendorApplicationOpen: event.isVendorApplicationOpen,
          distance: calculateDistance(lat, lng, event.latitude, event.longitude),
          vendorCount: event._count.vendors,
        }))
        .filter(event => event.distance! <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);

      // Fetch delivery zones covering user's area
      const deliveryZonesData = await db.deliveryZone.findMany({
        where: {
          isActive: true,
          isSuspended: false,
          ...(zipCode ? { zipCodes: { has: zipCode } } : {}),
        },
        select: {
          id: true,
          name: true,
          description: true,
          deliveryFee: true,
          freeDeliveryThreshold: true,
          minimumOrder: true,
          deliveryDays: true,
          deliveryType: true,
          zipCodes: true,
          cities: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              products: true,
            }
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      deliveryZones = deliveryZonesData.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description,
        deliveryFee: zone.deliveryFee,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
        minimumOrder: zone.minimumOrder,
        deliveryDays: zone.deliveryDays,
        deliveryType: zone.deliveryType as 'RECURRING' | 'ONE_TIME',
        zipCodes: zone.zipCodes,
        cities: zone.cities,
        productCount: zone._count.products,
        vendorName: zone.user.firstName
          ? `${zone.user.firstName} ${zone.user.lastName || ''}`.trim()
          : undefined,
      }));
    } else {
      // No location - fetch featured stands, farms, events, delivery zones
      const standsData = await db.marketStand.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        select: standSelect,
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      stands = standsData.map(stand => ({
        ...stand,
        images: stand.images || [],
        hours: stand.hours as MarketStandTileData['hours'],
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

      // Fetch upcoming events (no location filter)
      const now = new Date();
      const eventsData = await db.event.findMany({
        where: {
          isActive: true,
          status: 'APPROVED',
          endDate: { gte: now },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          images: true,
          tags: true,
          eventType: true,
          startDate: true,
          endDate: true,
          isRecurring: true,
          locationName: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
          maxVendors: true,
          maxAttendees: true,
          isVendorApplicationOpen: true,
          _count: {
            select: {
              vendors: true,
            }
          }
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 5,
      });

      events = eventsData.map(event => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        shortDescription: event.shortDescription,
        description: event.description,
        images: event.images || [],
        tags: event.tags || [],
        eventType: event.eventType as EventTileData['eventType'],
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        isRecurring: event.isRecurring,
        locationName: event.locationName,
        city: event.city,
        state: event.state,
        maxVendors: event.maxVendors,
        maxAttendees: event.maxAttendees,
        isVendorApplicationOpen: event.isVendorApplicationOpen,
        distance: null,
        vendorCount: event._count.vendors,
      }));

      // Fetch featured delivery zones
      const deliveryZonesData = await db.deliveryZone.findMany({
        where: {
          isActive: true,
          isSuspended: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          deliveryFee: true,
          freeDeliveryThreshold: true,
          minimumOrder: true,
          deliveryDays: true,
          deliveryType: true,
          zipCodes: true,
          cities: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              products: true,
            }
          }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      });

      deliveryZones = deliveryZonesData.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description,
        deliveryFee: zone.deliveryFee,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
        minimumOrder: zone.minimumOrder,
        deliveryDays: zone.deliveryDays,
        deliveryType: zone.deliveryType as 'RECURRING' | 'ONE_TIME',
        zipCodes: zone.zipCodes,
        cities: zone.cities,
        productCount: zone._count.products,
        vendorName: zone.user.firstName
          ? `${zone.user.firstName} ${zone.user.lastName || ''}`.trim()
          : undefined,
      }));
    }

    return {
      products,
      stands,
      farms,
      events,
      deliveryZones,
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
      events: [],
      deliveryZones: [],
    };
  }
});
