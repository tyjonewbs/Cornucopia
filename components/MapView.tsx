"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function MapView({ latitude, longitude, locationName }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 14,
      interactive: false,
    });

    // Add marker
    new mapboxgl.Marker()
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${locationName}</h3>`))
      .addTo(map.current);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, locationName]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full min-h-[200px]"
    />
  );
}
