'use client';

import { useState } from "react";
import Link from "next/link";
import { Truck, MapPin, Calendar, Package, ChevronDown } from "lucide-react";
import { ProductHamburgerRow } from "./ProductHamburgerRow";
import type { SerializedProduct } from "@/app/actions/home-products";

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
  products?: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
    updatedAt: string;
    inventoryUpdatedAt?: string | null;
    tags: string[];
    availableDate?: string | null;
    availableUntil?: string | null;
    deliveryAvailable: boolean;
    createdAt: string;
  }>;
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
  const [expanded, setExpanded] = useState(false);

  const nextDay = getNextDeliveryDay(zone.deliveryDays);
  const shortDays = zone.deliveryDays.map(d => d.substring(0, 3));
  const isFreeDelivery = zone.deliveryFee === 0;
  const coverageLabel = zone.cities.length > 0
    ? zone.cities.slice(0, 2).join(', ')
    : zone.zipCodes.length > 0
      ? `${zone.zipCodes.length} zip codes`
      : 'Local area';
  const hasProducts = zone.products && zone.products.length > 0;

  return (
    <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white border-2 border-blue-100 group">
        {/* Header - blue themed */}
        <Link href={`/delivery-zone/${zone.id}`} className="block">
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
        </Link>

        {/* Content */}
        <Link href={`/delivery-zone/${zone.id}`} className="block">
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
        </Link>

        {/* Expand/Collapse Button */}
        {hasProducts && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100 text-sm text-gray-600"
          >
            <span>{zone.products!.length} product{zone.products!.length !== 1 ? 's' : ''}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Expanded Product Rows */}
        {expanded && hasProducts && (
          <div className="border-t border-gray-100 overflow-hidden min-w-0">
            {zone.products!.slice(0, 5).map((product) => {
              const serializedProduct: SerializedProduct = {
                ...product,
                description: '',
                inventoryUpdatedAt: product.inventoryUpdatedAt ?? null,
                availableDate: product.availableDate ?? null,
                availableUntil: product.availableUntil ?? null,
                marketStand: null as any,
                deliveryInfo: {
                  isAvailable: true,
                  deliveryFee: zone.deliveryFee,
                  zoneName: zone.name,
                  zoneId: zone.id,
                  minimumOrder: zone.minimumOrder,
                  freeDeliveryThreshold: zone.freeDeliveryThreshold,
                  deliveryDays: zone.deliveryDays,
                },
                distance: null,
                availableAt: [],
                badge: null,
                locationName: '',
                totalReviews: 0,
                averageRating: null,
                status: 'APPROVED',
                userId: '',
                marketStandId: null,
                deliveryZoneId: zone.id,
                isActive: true,
              };
              return (
                <ProductHamburgerRow
                  key={product.id}
                  product={serializedProduct}
                />
              );
            })}
            {zone.productCount > 5 && (
              <Link
                href={`/delivery-zone/${zone.id}`}
                className="block px-4 py-2 text-center text-sm text-blue-700 hover:bg-blue-50 transition-colors font-medium"
              >
                View all products →
              </Link>
            )}
          </div>
        )}
      </div>
  );
}
