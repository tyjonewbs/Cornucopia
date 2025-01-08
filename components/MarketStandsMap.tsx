"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

interface MarketStand {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

interface MarketStandsMapProps {
  marketStands: MarketStand[];
}

export default function MarketStandsMap({ marketStands }: MarketStandsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || marketStands.length === 0) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    // Calculate center point from all market stands
    const bounds = new mapboxgl.LngLatBounds();
    marketStands.forEach(stand => {
      bounds.extend([stand.longitude, stand.latitude]);
    });

    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      bounds: bounds,
      fitBoundsOptions: { padding: 50 }
    });

    map.current = newMap;

    // Add markers for each market stand
    marketStands.forEach(stand => {
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold">${stand.name}</h3>
          <p class="text-sm text-gray-600">${stand.locationName}</p>
          <a href="/market-stand/${stand.id}" class="text-sm text-blue-500 hover:underline">View Details</a>
        </div>
      `);

      new mapboxgl.Marker()
        .setLngLat([stand.longitude, stand.latitude])
        .setPopup(popup)
        .addTo(newMap);
    });

    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl());

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [marketStands]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[600px] rounded-lg border"
    />
  );
}
