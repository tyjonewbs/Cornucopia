'use client';

import React from "react";
import { ProductTile } from "@/components/tiles/ProductTile";
import { MarketStandTile } from "@/components/tiles/MarketStandTile";
import { EventTile } from "@/components/tiles/EventTile";
import { DeliveryTile } from "@/components/tiles/DeliveryTile";
import type { MarketStandTileData } from "@/components/tiles/MarketStandTile";
import type { EventTileData } from "@/components/tiles/EventTile";
import type { DeliveryTileData } from "@/components/tiles/DeliveryTile";
import type { GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";

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

interface ResponsiveProductGridProps {
  products: GeoSerializedProduct[];
  stands?: MarketStandTileData[];
  farms?: Farm[];
  events?: EventTileData[];
  deliveryZones?: DeliveryTileData[];
  showPromoBanners?: boolean;
  userId?: string;
}

/**
 * Mixed-type grid that interleaves products with market stands, events, and delivery zone tiles.
 * Products are the primary content. Other tile types are inserted at strategic intervals
 * to create visual variety and surface different content types.
 *
 * Layout pattern (every 6 products):
 * - After product 3: insert a market stand or farm tile
 * - After product 6: insert an event or delivery zone tile
 * This creates a rhythm where non-product tiles appear roughly every 3 items.
 */
export function ResponsiveProductGrid({
  products,
  stands = [],
  farms = [],
  events = [],
  deliveryZones = [],
  showPromoBanners = true,
}: ResponsiveProductGridProps) {
  const gridItems: React.JSX.Element[] = [];

  // Build a queue of non-product tiles to intersperse
  const specialTiles: React.JSX.Element[] = [];

  if (showPromoBanners) {
    // Interleave: stand, event, delivery, stand, event, delivery...
    const standTiles = stands.map(stand => (
      <MarketStandTile key={`stand-${stand.id}`} stand={stand} />
    ));

    const eventTiles = events.map(event => (
      <EventTile key={`event-${event.id}`} event={event} />
    ));

    const deliveryTiles = deliveryZones.map(zone => (
      <DeliveryTile key={`delivery-${zone.id}`} zone={zone} />
    ));

    // Round-robin merge the special tiles for variety
    const maxLen = Math.max(standTiles.length, eventTiles.length, deliveryTiles.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < standTiles.length) specialTiles.push(standTiles[i]);
      if (i < eventTiles.length) specialTiles.push(eventTiles[i]);
      if (i < deliveryTiles.length) specialTiles.push(deliveryTiles[i]);
    }
  }

  let specialIndex = 0;
  const INSERT_INTERVAL = 4; // Insert a special tile every N products

  products.forEach((product, index) => {
    // Add product tile
    gridItems.push(
      <ProductTile key={`product-${product.id}`} product={product} />
    );

    // Insert a special tile after every INSERT_INTERVAL products
    if (showPromoBanners && (index + 1) % INSERT_INTERVAL === 0 && specialIndex < specialTiles.length) {
      gridItems.push(specialTiles[specialIndex]);
      specialIndex++;
    }
  });

  // If there are remaining special tiles and few products, append them
  if (products.length < 4 && specialTiles.length > 0) {
    for (let i = specialIndex; i < Math.min(specialIndex + 3, specialTiles.length); i++) {
      gridItems.push(specialTiles[i]);
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
      {gridItems}
    </div>
  );
}
