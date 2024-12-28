"use client"

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MapPin } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  distance?: number;
}

interface MapViewProps {
  products: Product[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MapView({ products }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]); // Default to London
  const [mapKey, setMapKey] = useState(0); // Used to force map re-render

  useEffect(() => {
    // Get user's location when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setMapCenter([newLocation.lat, newLocation.lng]);
          setMapKey(prev => prev + 1);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const productsWithDistance = products.map(product => ({
    ...product,
    distance: userLocation && product.latitude && product.longitude
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          product.latitude,
          product.longitude
        )
      : undefined
  }));

  return (
    <div className="space-y-4">
      <Button 
        variant="outline"
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const newLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                setUserLocation(newLocation);
                setMapCenter([newLocation.lat, newLocation.lng]);
                setMapKey(prev => prev + 1);
              }
            );
          }
        }}
      >
        <MapPin className="h-4 w-4 mr-2" />
        Update My Location
      </Button>

      <div className="h-[600px] rounded-lg overflow-hidden">
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {productsWithDistance.map((product) => (
            product.latitude && product.longitude ? (
              <Marker 
                key={product.id}
                position={[product.latitude, product.longitude]}
                icon={customIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">${product.price}</p>
                    {userLocation && product.distance && (
                      <p className="text-sm text-gray-500 mt-1">
                        {product.distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={customIcon}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
