"use client";

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ['places'];

export interface MapViewEditableProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onLocationChange: (lat: number, lng: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '200px',
};

export default function MapViewEditable({
  latitude,
  longitude,
  locationName,
  onLocationChange
}: MapViewEditableProps) {
  const [markerPosition, setMarkerPosition] = useState({ lat: latitude, lng: longitude });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationChange(lat, lng);
    }
  }, [onLocationChange]);

  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        Invalid coordinates
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition}
      zoom={14}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }}
    >
      <Marker
        position={markerPosition}
        draggable
        onDragEnd={handleMarkerDragEnd}
        title={`Drag to update location for ${locationName}`}
      />
    </GoogleMap>
  );
}
