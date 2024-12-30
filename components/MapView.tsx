'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { debounce } from 'lodash';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
}

interface MapViewProps {
  marketStands: Location[];
}

export default function MapView({ marketStands }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Create custom marker icon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 2rem;
          height: 2rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translate(-50%, -50%);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" style="width: 1.25rem; height: 1.25rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Handle map resize
  const handleResize = useCallback(
    debounce(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100),
    []
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!mapRef.current) {
        mapRef.current = L.map('map', {
          zoomControl: false, // We'll add it manually to the top-right
          attributionControl: false // We'll add it manually to the bottom-right
        }).setView([marketStands[0].latitude, marketStands[0].longitude], 13);

        // Add zoom control to the top-right
        L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

        // Add attribution control to the bottom-right
        L.control.attribution({
          position: 'bottomright',
          prefix: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
      }

      // Clear existing markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });

      const customIcon = createCustomIcon();

      // Add markers for each market stand
      marketStands.forEach((stand) => {
        const marker = L.marker([stand.latitude, stand.longitude], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-lg mb-1">${stand.name}</h3>
              <p class="font-medium text-sm mb-1">${stand.locationName}</p>
              <p class="text-sm text-gray-600">${stand.locationGuide}</p>
            </div>
          `, {
            maxWidth: 300,
            className: 'rounded-lg shadow-lg'
          });
      });

      // If only one market stand, center on it
      if (marketStands.length === 1) {
        mapRef.current.setView([marketStands[0].latitude, marketStands[0].longitude], 15);
      }
      // If multiple stands, fit bounds to include all
      else if (marketStands.length > 1) {
        const bounds = L.latLngBounds(marketStands.map(stand => [stand.latitude, stand.longitude]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      // Add resize listener
      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [marketStands, handleResize]);

  return (
    <div id="map" className="w-full h-full">
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 0;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0;
        }
        .leaflet-popup-tip {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
