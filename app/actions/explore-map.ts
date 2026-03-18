'use server';

import { cache } from 'react';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import type { Local, MarketStand } from '@prisma/client';

// Types for map items
export type MapItemType = 'market-stand' | 'local' | 'event' | 'delivery';

export interface MapItem {
  id: string;
  type: MapItemType;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image: string | null;
  href: string;
  locationName: string;
  tags: string[];
  // Event-specific fields
  eventDate?: string;
  eventTime?: string;
  // Local-specific fields
  farmName?: string;
  // Delivery-specific fields
  deliveryFee?: number;
  deliveryDays?: string[];
  deliveryCoverage?: string;
  nextDeliveryDate?: string;
  ownerName?: string;
}

export interface ExploreMapData {
  marketStands: MapItem[];
  locals: MapItem[];
  events: MapItem[];
  deliveries: MapItem[];
}

// Event structure expected in Local.events JSON field
interface LocalEvent {
  id?: string;
  name: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  // If event has specific lat/lng different from the local
  latitude?: number;
  longitude?: number;
}

// Build a human-readable coverage string from zone data
function formatDeliveryCoverage(cities: string[], states: string[], zipCodes: string[]): string {
  const parts: string[] = [];
  if (cities.length > 0) parts.push(cities.slice(0, 3).join(', ') + (cities.length > 3 ? ` +${cities.length - 3} more` : ''));
  if (states.length > 0) parts.push(states.join(', '));
  if (zipCodes.length > 0 && parts.length === 0) parts.push(zipCodes.slice(0, 3).join(', ') + (zipCodes.length > 3 ? ` +${zipCodes.length - 3} more` : ''));
  return parts.join(' · ') || 'Local delivery';
}

export const getExploreMapData = cache(async (): Promise<ExploreMapData> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch market stands, locals, and delivery zones in parallel
    const [marketStands, locals, deliveryZones] = await Promise.all([
      db.marketStand.findMany({
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
          images: true,
          tags: true,
        }
      }),

      db.local.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
      }) as Promise<Local[]>,

      db.deliveryZone.findMany({
        where: {
          isActive: true,
          isSuspended: false,
          deliveries: {
            some: {
              date: { gte: today },
              status: { in: ['SCHEDULED', 'OPEN'] },
            },
          },
        },
        include: {
          user: {
            include: {
              marketStands: {
                where: { isActive: true, status: 'APPROVED' },
                take: 1,
                select: { id: true, name: true, latitude: true, longitude: true, locationName: true, images: true },
              },
              locals: {
                where: { isActive: true, status: 'APPROVED' },
                take: 1,
                select: { id: true, name: true, slug: true, latitude: true, longitude: true, locationName: true, images: true },
              },
            },
          },
          deliveries: {
            where: {
              date: { gte: today },
              status: { in: ['SCHEDULED', 'OPEN'] },
            },
            orderBy: { date: 'asc' as const },
            take: 1,
          },
        },
      }),
    ]);

    // Transform market stands
    const marketStandItems: MapItem[] = marketStands.map(stand => ({
      id: stand.id,
      type: 'market-stand' as MapItemType,
      name: stand.name,
      description: stand.description,
      latitude: stand.latitude,
      longitude: stand.longitude,
      image: stand.images?.[0] || null,
      href: `/market-stand/${stand.id}`,
      locationName: stand.locationName,
      tags: stand.tags,
    }));

    // Transform locals - cast to any to handle optional fields that may not be in generated types
    const localItems: MapItem[] = locals.map(local => {
      const localAny = local as any;
      return {
        id: local.id,
        type: 'local' as MapItemType,
        name: local.name,
        description: localAny.tagline || local.description,
        latitude: local.latitude,
        longitude: local.longitude,
        image: local.images?.[0] || null,
        href: localAny.slug ? `/local/${localAny.slug}` : `/local/${local.id}`,
        locationName: local.locationName,
        tags: [],
      };
    });

    // Extract events from locals
    const eventItems: MapItem[] = [];
    for (const local of locals) {
      const localAny = local as any;
      if (local.events && typeof local.events === 'object') {
        // Handle events as an object with array of events or as direct array
        const eventsData = local.events as any;
        const eventList: LocalEvent[] = Array.isArray(eventsData)
          ? eventsData
          : (eventsData.events || eventsData.upcoming || []);

        for (const event of eventList) {
          if (event && event.name) {
            // Use event-specific location if provided, otherwise use local's location
            const eventLat = event.latitude ?? local.latitude;
            const eventLng = event.longitude ?? local.longitude;

            eventItems.push({
              id: event.id || `${local.id}-event-${eventItems.length}`,
              type: 'event' as MapItemType,
              name: event.name,
              description: event.description || null,
              latitude: eventLat,
              longitude: eventLng,
              image: local.images?.[0] || null,
              href: localAny.slug ? `/local/${localAny.slug}` : `/local/${local.id}`,
              locationName: event.location || local.locationName,
              tags: [],
              eventDate: event.date,
              eventTime: event.time,
              farmName: local.name,
            });
          }
        }
      }
    }

    // Transform delivery zones - resolve lat/lng from owner's stand or farm
    const deliveryItems: MapItem[] = [];
    for (const zone of deliveryZones) {
      // Prefer market stand location, fall back to farm
      const stand = zone.user.marketStands[0];
      const local = zone.user.locals[0];
      const source = stand || local;

      // Skip if the owner has no mappable location
      if (!source) continue;

      const nextDelivery = zone.deliveries[0];

      deliveryItems.push({
        id: zone.id,
        type: 'delivery' as MapItemType,
        name: zone.name,
        description: zone.description || null,
        latitude: source.latitude,
        longitude: source.longitude,
        image: source.images?.[0] || null,
        href: stand ? `/market-stand/${stand.id}` : `/local/${(local as any).slug || local!.id}`,
        locationName: source.locationName,
        tags: [],
        deliveryFee: zone.deliveryFee,
        deliveryDays: zone.deliveryDays,
        deliveryCoverage: formatDeliveryCoverage(zone.cities, zone.states, zone.zipCodes),
        nextDeliveryDate: nextDelivery ? nextDelivery.date.toISOString() : undefined,
        ownerName: source.name,
      });
    }

    return {
      marketStands: marketStandItems,
      locals: localItems,
      events: eventItems,
      deliveries: deliveryItems,
    };
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to fetch explore map data");
    console.error('Error fetching explore map data:', errorData);

    return {
      marketStands: [],
      locals: [],
      events: [],
      deliveries: [],
    };
  }
});

// Get count of items for each category
export const getExploreMapCounts = cache(async () => {
  try {
    const [marketStandCount, localCount] = await Promise.all([
      db.marketStand.count({
        where: { isActive: true, status: 'APPROVED' }
      }),
      db.local.count({
        where: { isActive: true, status: 'APPROVED' }
      })
    ]);

    return {
      marketStands: marketStandCount,
      locals: localCount,
    };
  } catch (error) {
    console.error('Error fetching map counts:', error);
    return { marketStands: 0, locals: 0 };
  }
});
