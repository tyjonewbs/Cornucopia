'use client';

import { MapPin, Clock, Navigation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PickupLocationCardProps {
  standId: string;
  standName: string;
  streetAddress?: string | null;
  city?: string | null;
  zipCode?: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  inventory: number;
}

export function PickupLocationCard({
  standId,
  standName,
  streetAddress,
  city,
  zipCode,
  locationName,
  latitude,
  longitude,
  inventory,
}: PickupLocationCardProps) {
  // Construct full address
  const hasDetailedAddress = streetAddress || city || zipCode;
  const fullAddress = hasDetailedAddress
    ? [streetAddress, city, zipCode].filter(Boolean).join(', ')
    : locationName;

  // Build Google Maps static image URL
  const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=14&size=400x200&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Mini Map */}
      <div className="relative h-48 bg-gray-100">
        <Image
          src={mapImageUrl}
          alt={`Map showing ${standName} location`}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-900 shadow-sm">
          <MapPin className="h-4 w-4 inline mr-1 text-primary" />
          Pickup Location
        </div>
      </div>

      <div className="p-5">
        {/* Real-Time Inventory */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Availability</span>
            <span className={`text-lg font-bold ${inventory > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {inventory > 0 ? `${inventory} available now` : 'Out of stock'}
            </span>
          </div>
        </div>

        {/* Address Display */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Address</h4>
          <p className="text-base font-medium text-gray-900">{fullAddress}</p>
        </div>

        {/* Main Action Button */}
        <Link
          href={`/navigate/${standId}`}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium group"
        >
          <Navigation className="h-5 w-5" />
          <span>Get Directions & Hours</span>
        </Link>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              Check hours and get turn-by-turn directions to {standName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
