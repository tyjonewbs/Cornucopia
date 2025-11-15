'use client';

import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { getDeliveryTiming } from "@/lib/utils/delivery-format";

interface ProductCardProps {
  images: string[];
  name: string;
  id: string;
  locationName: string;
  updatedAt: string;
  inventory?: number;
  isQRAccess?: boolean;
  price?: number;
  tags?: string[];
  distance?: number | null;
  availableDate?: string | null;
  availableUntil?: string | null;
  deliveryAvailable?: boolean;
  availableAt?: Array<{
    id: string;
    name: string;
    distance: number | null;
    locationName: string;
  }>;
  deliveryInfo?: {
    isAvailable: boolean;
    deliveryFee: number | null;
    zoneName: string | null;
    zoneId: string | null;
    minimumOrder: number | null;
    freeDeliveryThreshold: number | null;
    deliveryDays?: string[];
    nextDeliveryDate?: string | null;
  } | null;
  badge?: {
    text: string;
    color: string;
    type: string;
  } | null;
}

export function ProductCard({
  images,
  id,
  name,
  locationName,
  updatedAt,
  inventory,
  isQRAccess = false,
  price,
  tags = [],
  distance,
  availableDate,
  availableUntil,
  deliveryAvailable = false,
  availableAt = [],
  deliveryInfo = null,
  badge = null,
}: ProductCardProps) {
  return (
    <Link 
      href={`/product/${encodeURIComponent(id)}${isQRAccess ? '?qr=true' : ''}`}
      className="block group"
    >
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative aspect-[4/3] w-full">
          <div className="absolute top-2 left-2 right-2 flex gap-2 z-10 flex-wrap">
            {/* Smart Badge - calculated server-side */}
            {badge && (
              <div className={`${badge.color} text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg`}>
                {badge.text}
              </div>
            )}
            
            {/* Inventory badge */}
            {typeof inventory === 'number' && inventory > 0 && (
              <div className="ml-auto bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                {inventory} left
              </div>
            )}
          </div>
          <Image
            alt={name}
            src={images[0]}
            fill
            className="object-cover rounded-t-lg transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
        </div>
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{name}</h2>
            {typeof price === 'number' && (
              <p className="font-medium text-primary">
                {(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            )}
          </div>
          
          {/* Market Stand Locations */}
          {availableAt.length > 0 && (
            <div className="mt-2 space-y-1">
              {/* Closest Market Stand */}
              <Link 
                href={`/market-stand/${availableAt[0].id}`}
                className="flex items-start gap-1 text-sm hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-gray-500 mt-0.5">📍</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{availableAt[0].name}</p>
                  <p className="text-xs text-gray-600">
                    {availableAt[0].distance !== null 
                      ? `${Math.round(availableAt[0].distance * 0.621371)} miles away`
                      : availableAt[0].locationName
                    }
                  </p>
                </div>
              </Link>
              
              {/* Additional Locations */}
              {availableAt.length > 1 && (
                <div className="text-xs text-gray-600 pl-5">
                  + Available at {availableAt.length - 1} other location{availableAt.length > 2 ? 's' : ''}
                </div>
              )}
            </div>
          )}
          
          {/* Fallback for products without availableAt data */}
          {availableAt.length === 0 && (
            <div className="mt-1">
              {locationName ? (
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-sm">{locationName}</p>
                  {distance !== null && distance !== undefined && (
                    <p className="text-sm text-primary">
                      {Math.round(distance * 0.621371)} miles away
                    </p>
                  )}
                </div>
              ) : deliveryAvailable ? (
                (() => {
                  const deliveryTimings = getDeliveryTiming({
                    deliveryDays: deliveryInfo?.deliveryDays,
                    availableDate,
                    availableUntil,
                  });
                  
                  return deliveryTimings.length > 0 ? (
                    <div className="space-y-1">
                      {deliveryTimings.map((timing, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">🚚</span>
                            <p className="text-gray-600 text-sm font-medium">Delivery Only</p>
                          </div>
                          <p className="text-sm text-primary font-medium">{timing}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">🚚</span>
                      <p className="text-gray-600 text-sm font-medium">Delivery Only</p>
                    </div>
                  );
                })()
              ) : null}
            </div>
          )}
          
          {/* Delivery Information */}
          {deliveryInfo?.isAvailable && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2">
              <div className="flex items-start gap-1 text-sm">
                <span className="text-green-600 mt-0.5">🚚</span>
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    {deliveryInfo.zoneName || 'Delivery Available'}
                  </p>
                  {deliveryInfo.deliveryDays && deliveryInfo.deliveryDays.length > 0 && (
                    <p className="text-xs text-green-700">
                      {deliveryInfo.deliveryDays.slice(0, 3).map(d => d.substring(0, 3)).join(', ')}
                      {deliveryInfo.deliveryDays.length > 3 && ` +${deliveryInfo.deliveryDays.length - 3}`}
                    </p>
                  )}
                  <p className="text-xs text-green-700 mt-0.5">
                    {deliveryInfo.deliveryFee === null || deliveryInfo.deliveryFee === 0 
                      ? 'Free Delivery'
                      : `Fee: ${(deliveryInfo.deliveryFee / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
                    }
                    {deliveryInfo.freeDeliveryThreshold && deliveryInfo.deliveryFee !== 0 && (
                      ` • Free over $${(deliveryInfo.freeDeliveryThreshold / 100).toFixed(0)}`
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag: string, index: number) => (
                <div
                  key={index}
                  className="bg-secondary px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function LoadingProductCard() {
  return (
    <div className="rounded-lg overflow-hidden shadow-md">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
