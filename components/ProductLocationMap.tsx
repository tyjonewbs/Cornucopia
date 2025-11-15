'use client';

import { MapPin } from "lucide-react";

interface ProductLocationMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  standName: string;
  standId: string;
}

export function ProductLocationMap({
  latitude,
  longitude,
  locationName,
  standName,
  standId,
}: ProductLocationMapProps) {
  // Create a static map URL using a mapping service
  // Using OpenStreetMap's static map API
  const zoom = 15;
  const width = 600;
  const height = 300;
  
  // StaticMapLite service for OpenStreetMap
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=${latitude},${longitude},red-pushpin`;
  
  return (
    <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
      <div className="relative aspect-[2/1] w-full bg-gray-100">
        <img
          src={mapUrl}
          alt={`Map showing ${locationName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a solid color with text if map fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `
              <div class="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-blue-100">
                <div class="text-center p-6">
                  <svg class="w-16 h-16 mx-auto mb-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <p class="text-sm font-medium text-gray-900">${locationName}</p>
                  <p class="text-xs text-gray-600 mt-1">Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
                </div>
              </div>
            `;
          }}
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{standName}</p>
            <p className="text-sm text-gray-600">{locationName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <a
            href={`/navigate/${standId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Get Directions
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            Open in Maps
          </a>
        </div>
      </div>
    </div>
  );
}
