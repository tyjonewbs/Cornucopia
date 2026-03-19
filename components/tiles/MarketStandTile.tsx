'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Clock, Star, ChevronDown } from "lucide-react";
import { ProductHamburgerRow } from "./ProductHamburgerRow";
import type { SerializedProduct } from "@/app/actions/home-products";

export interface MarketStandTileData {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  images: string[];
  tags: string[];
  distance: number | null;
  averageRating?: number | null;
  totalReviews?: number;
  hours?: Record<string, { open: string; close: string } | null> | null;
  isOpen?: boolean;
  lastCheckedIn?: Date | string | null;
  _count?: {
    products: number;
  };
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

interface MarketStandTileProps {
  stand: MarketStandTileData;
}

function getOpenStatus(hours: Record<string, { open: string; close: string } | null> | null | undefined): {
  isOpen: boolean;
  label: string;
} {
  if (!hours) return { isOpen: false, label: '' };

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[now.getDay()];
  const todayHours = hours[currentDay];

  if (!todayHours) return { isOpen: false, label: 'Closed today' };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const openMin = openH * 60 + (openM || 0);
  const closeMin = closeH * 60 + (closeM || 0);

  if (currentMinutes >= openMin && currentMinutes < closeMin) {
    return { isOpen: true, label: `Open until ${todayHours.close}` };
  }

  if (currentMinutes < openMin) {
    return { isOpen: false, label: `Opens at ${todayHours.open}` };
  }

  return { isOpen: false, label: 'Closed now' };
}

export function MarketStandTile({ stand }: MarketStandTileProps) {
  const [expanded, setExpanded] = useState(false);

  // Prioritize isOpen field from QR portal, fallback to hours-based calculation
  const calculatedStatus = getOpenStatus(stand.hours as any);
  const openStatus = stand.isOpen !== undefined
    ? { isOpen: stand.isOpen, label: stand.isOpen ? 'Open Now' : 'Closed' }
    : calculatedStatus;

  // Format last check-in time if available
  const getLastCheckedInText = () => {
    if (!stand.lastCheckedIn) return null;
    const checkedIn = new Date(stand.lastCheckedIn);
    const now = new Date();
    const diffMs = now.getTime() - checkedIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Checked in recently';
    if (diffHours < 24) return `Checked in ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Checked in ${diffDays}d ago`;
  };

  const lastCheckedInText = getLastCheckedInText();
  const productCount = stand._count?.products ?? 0;
  const hasProducts = stand.products && stand.products.length > 0;

  return (
    <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white border-2 border-emerald-100 group">
        {/* Image with green overlay branding */}
        <Link href={`/market-stand/${stand.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* Stand type badge */}
          <div className="absolute top-2 left-2 z-10 bg-emerald-700/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
            <Store className="w-3 h-3" />
            <span>Market Stand</span>
          </div>

          {/* Open/Closed indicator */}
          {openStatus.label && (
            <div className={`absolute top-2 right-2 z-10 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
              openStatus.isOpen
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-800/60 text-gray-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              {openStatus.label}
            </div>
          )}

          {stand.images[0] ? (
            <Image
              alt={stand.name}
              src={stand.images[0]}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={85}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
              <Store className="w-12 h-12 text-emerald-400" />
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Product count */}
          {productCount > 0 && (
            <div className="absolute bottom-1.5 left-2 z-10 text-white text-[10px] font-medium">
              {productCount} product{productCount !== 1 ? 's' : ''}
            </div>
          )}

          {/* Distance */}
          {stand.distance != null && (
            <div className="absolute bottom-1.5 right-2 z-10 text-white text-[10px] font-medium">
              {Math.round(stand.distance * 0.621371)} mi
            </div>
          )}
        </div>
        </Link>

        {/* Content */}
        <Link href={`/market-stand/${stand.id}`} className="block">
        <div className="p-2.5 bg-gradient-to-b from-white to-emerald-50/30">
          <h3 className="font-bold text-sm leading-tight line-clamp-1 text-gray-900">
            {stand.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {stand.locationName}
          </p>

          {/* Rating and hours/check-in row */}
          <div className="flex items-center gap-2 mt-1.5">
            {stand.averageRating != null && stand.averageRating > 0 && (
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-semibold">{stand.averageRating.toFixed(1)}</span>
                {stand.totalReviews != null && stand.totalReviews > 0 && (
                  <span className="text-gray-400 text-[10px]">({stand.totalReviews})</span>
                )}
              </div>
            )}
            {lastCheckedInText && (
              <div className="flex items-center gap-0.5 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">{lastCheckedInText}</span>
              </div>
            )}
            {!lastCheckedInText && stand.hours && (
              <div className="flex items-center gap-0.5 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">Hours listed</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {stand.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 overflow-hidden">
              {stand.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
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
            <span>{stand.products!.length} product{stand.products!.length !== 1 ? 's' : ''}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Expanded Product Rows */}
        {expanded && hasProducts && (
          <div className="border-t border-gray-100 overflow-hidden min-w-0">
            {stand.products!.slice(0, 5).map((product) => {
              const serializedProduct: SerializedProduct = {
                ...product,
                description: '',
                inventoryUpdatedAt: product.inventoryUpdatedAt ?? null,
                availableDate: product.availableDate ?? null,
                availableUntil: product.availableUntil ?? null,
                marketStand: null as any,
                deliveryInfo: null,
                distance: null,
                availableAt: [],
                badge: null,
                locationName: stand.locationName,
                totalReviews: 0,
                averageRating: null,
                status: 'APPROVED',
                userId: '',
                marketStandId: null,
                deliveryZoneId: null,
                isActive: true,
              };
              return (
                <ProductHamburgerRow
                  key={product.id}
                  product={serializedProduct}
                />
              );
            })}
            {productCount > 5 && (
              <Link
                href={`/market-stand/${stand.id}`}
                className="block px-4 py-2 text-center text-sm text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
              >
                View all at stand →
              </Link>
            )}
          </div>
        )}
      </div>
  );
}
