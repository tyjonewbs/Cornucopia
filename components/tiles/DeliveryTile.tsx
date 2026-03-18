'use client';

import Link from "next/link";
import { Truck, MapPin, Calendar, Package } from "lucide-react";

export interface DeliveryTileData {
  id: string;
  name: string;
  description: string | null;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  minimumOrder: number | null;
  deliveryDays: string[];
  deliveryType: 'RECURRING' | 'ONE_TIME';
  zipCodes: string[];
  cities: string[];
  productCount: number;
  /** Owner's display name or stand name */
  vendorName?: string;
}

interface DeliveryTileProps {
  zone: DeliveryTileData;
}

function getNextDeliveryDay(deliveryDays: string[]): string | null {
  if (!deliveryDays.length) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();

  // Find nearest upcoming delivery day
  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (today + offset) % 7;
    const dayName = dayNames[dayIndex];
    if (deliveryDays.includes(dayName)) {
      if (offset === 0) return 'Today';
      if (offset === 1) return 'Tomorrow';
      return dayName;
    }
  }
  return null;
}

export function DeliveryTile({ zone }: DeliveryTileProps) {
  const nextDay = getNextDeliveryDay(zone.deliveryDays);
  const shortDays = zone.deliveryDays.map(d => d.substring(0, 3));
  const isFreeDelivery = zone.deliveryFee === 0;
  const coverageLabel = zone.cities.length > 0
    ? zone.cities.slice(0, 2).join(', ')
    : zone.zipCodes.length > 0
      ? `${zone.zipCodes.length} zip codes`
      : 'Local area';

  return (
    <Link
      href={`/delivery-zone/${zone.id}`}
      className="block group"
    >
      <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white border-2 border-blue-100">
        {/* Header - blue themed */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 aspect-[4/3] p-3 flex flex-col justify-between overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" aria-hidden="true">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id={`delivery-pattern-${zone.id}`} patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="1.5" fill="white" />
              </pattern>
              <rect width="100" height="100" fill={`url(#delivery-pattern-${zone.id})`} />
            </svg>
          </div>

          {/* Top row */}
          <div className="flex items-start justify-between z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
              <Truck className="w-3 h-3 text-white" aria-hidden="true" />
              <span className="text-white text-[10px] font-semibold">
                {zone.deliveryType === 'RECURRING' ? 'Weekly Delivery' : 'One-Time Delivery'}
              </span>
            </div>
            {isFreeDelivery && (
              <div className="bg-green-400/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                FREE
              </div>
            )}
          </div>

          {/* Center content */}
          <div className="z-10 text-center">
            <Truck className="w-10 h-10 text-white/80 mx-auto mb-1" aria-hidden="true" />
            {nextDay && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                <p className="text-white text-[10px] font-medium">Next delivery</p>
                <p className="text-white text-sm font-bold">{nextDay}</p>
              </div>
            )}
          </div>

          {/* Bottom row - schedule dots */}
          <div className="flex justify-center gap-1 z-10">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  shortDays.includes(day)
                    ? 'bg-white text-blue-700'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {day.charAt(0)}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-2.5 bg-gradient-to-b from-white to-blue-50/30">
          <h3 className="font-bold text-sm leading-tight line-clamp-1 text-gray-900">
            {zone.name}
          </h3>

          {zone.vendorName && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              by {zone.vendorName}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5">
            {/* Coverage */}
            <div className="flex items-center gap-0.5 text-gray-500">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              <span className="text-[10px]">{coverageLabel}</span>
            </div>

            {/* Products */}
            {zone.productCount > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Package className="w-3 h-3" aria-hidden="true" />
                <span className="text-[10px]">{zone.productCount}</span>
              </div>
            )}
          </div>

          {/* Pricing info */}
          <div className="flex items-center gap-2 mt-1.5">
            {!isFreeDelivery && (
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                {(zone.deliveryFee / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} delivery
              </span>
            )}
            {zone.freeDeliveryThreshold && (
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                Free over ${(zone.freeDeliveryThreshold / 100).toFixed(0)}
              </span>
            )}
            {zone.minimumOrder && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                Min ${(zone.minimumOrder / 100).toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
