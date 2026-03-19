"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";

interface MapLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 39.5, lng: -119.8 }; // Reno, NV area

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export function MapLocationPicker({
  initialLat,
  initialLng,
  onLocationChange,
}: MapLocationPickerProps) {
  const [center, setCenter] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER
  );
  const [markerPosition, setMarkerPosition] = useState(center);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Get user's GPS location on mount if no initial coordinates provided
  useEffect(() => {
    if (!initialLat || !initialLng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCenter(userLocation);
            setMarkerPosition(userLocation);
            onLocationChange(userLocation.lat, userLocation.lng);
          },
          (error) => {
            console.log("GPS access denied or unavailable:", error);
            // Stay with default center
          }
        );
      }
    }
  }, [initialLat, initialLng, onLocationChange]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        onLocationChange(lat, lng);
      }
    },
    [onLocationChange]
  );

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPosition = { lat, lng };
        setCenter(newPosition);
        setMarkerPosition(newPosition);
        onLocationChange(lat, lng);

        if (map) {
          map.panTo(newPosition);
        }
      }
    }
  }, [autocomplete, map, onLocationChange]);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          setMarkerPosition(userLocation);
          onLocationChange(userLocation.lat, userLocation.lng);

          if (map) {
            map.panTo(userLocation);
          }
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, [map, onLocationChange]);

  if (loadError) {
    return (
      <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-sm text-destructive">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {isLoaded && (
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            className="flex-1"
          >
            <input
              type="text"
              placeholder="Search for an address..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D2C] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
          </Autocomplete>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleUseCurrentLocation}
          disabled={isLoadingLocation}
          title="Use my current location"
        >
          <Locate className={`h-4 w-4 ${isLoadingLocation ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
            zoomControl: true,
          }}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
          />
        </GoogleMap>
      </div>

      <p className="text-xs text-muted-foreground">
        Location: {markerPosition.lat.toFixed(5)}°N, {Math.abs(markerPosition.lng).toFixed(5)}°
        {markerPosition.lng < 0 ? "W" : "E"}
      </p>
    </div>
  );
}
