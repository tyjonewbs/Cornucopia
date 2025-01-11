'use client';

import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import Link from 'next/link';

const libraries: Libraries = ['places', 'geometry'];

interface MarketStand {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface MarketStandsMapProps {
  marketStands: MarketStand[];
  userLocation?: { lat: number; lng: number } | null;
}

const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem'
};

export default function MarketStandsMap({ marketStands, userLocation }: MarketStandsMapProps) {
  const [selectedStand, setSelectedStand] = useState<MarketStand | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    if (marketStands.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    marketStands.forEach(stand => {
      bounds.extend({ lat: stand.latitude, lng: stand.longitude });
    });
    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    }
    map.fitBounds(bounds);
  }, [marketStands, userLocation]);

  const center = useMemo(() => {
    if (marketStands.length === 0) {
      return { lat: 0, lng: 0 };
    }
    return userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: marketStands[0].latitude, lng: marketStands[0].longitude };
  }, [marketStands, userLocation]);

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] rounded-lg border flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  if (marketStands.length === 0) {
    return (
      <div className="w-full h-[600px] rounded-lg border flex items-center justify-center">
        No market stands available
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr,300px] gap-4">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        options={{
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#4F46E5',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
          />
        )}

        {/* Market stand markers */}
        {marketStands.map(stand => (
          <Marker
            key={stand.id}
            position={{ lat: stand.latitude, lng: stand.longitude }}
            onClick={() => setSelectedStand(stand)}
          />
        ))}

        {/* Info window for selected stand */}
        {selectedStand && (
          <InfoWindow
            position={{ lat: selectedStand.latitude, lng: selectedStand.longitude }}
            onCloseClick={() => setSelectedStand(null)}
          >
            <div className="p-2">
              <h3 className="font-medium mb-1">{selectedStand.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedStand.locationName}</p>
              {selectedStand.distance !== undefined && (
                <p className="text-sm text-primary mb-2">
                  {selectedStand.distance.toFixed(1)} km away
                </p>
              )}
              <Link
                href={`/market-stand/${selectedStand.id}`}
                className="text-sm text-primary hover:underline"
              >
                View Details
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="bg-white rounded-lg p-4 shadow-sm h-[600px] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-4">Market Stands</h3>
        <div className="space-y-3">
          {marketStands.map(stand => (
            <Link
              key={stand.id}
              href={`/market-stand/${stand.id}`}
              className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedStand(stand)}
            >
              <h4 className="font-medium">{stand.name}</h4>
              <p className="text-sm text-muted-foreground">{stand.locationName}</p>
              {stand.distance !== undefined && (
                <p className="text-sm text-primary mt-1">
                  {stand.distance.toFixed(1)} km away
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
