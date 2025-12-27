'use server';

import { cache } from 'react';
import db from "@/lib/db";
import { handleDatabaseError } from "@/lib/error-handler";
import type { Local, MarketStand } from '@prisma/client';

// Types for map items
export type MapItemType = 'market-stand' | 'local' | 'event';

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
}

export interface ExploreMapData {
  marketStands: MapItem[];
  locals: MapItem[];
  events: MapItem[];
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

export const getExploreMapData = cache(async (): Promise<ExploreMapData> => {
  try {
    // Fetch market stands
    const marketStands = await db.marketStand.findMany({
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
    });

    // Fetch locals (farms) - select all fields since we need slug and tagline which are optional
    const locals = await db.local.findMany({
      where: {
        isActive: true,
        status: 'APPROVED'
      },
    }) as Local[];

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

    return {
      marketStands: marketStandItems,
      locals: localItems,
      events: eventItems,
    };
  } catch (error) {
    const errorData = handleDatabaseError(error, "Failed to fetch explore map data");
    console.error('Error fetching explore map data:', errorData);
    
    return {
      marketStands: [],
      locals: [],
      events: [],
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
