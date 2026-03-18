'use client';

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Truck, ShoppingBag, Clock } from "lucide-react";
import { deriveFreshnessTags } from "./FreshnessBadge";
import type { SerializedProduct } from "@/app/actions/home-products";

interface ProductHamburgerRowProps {
  product: SerializedProduct;
}

const FRESHNESS_STYLES: Record<string, { label: string; className: string }> = {
  'just-updated': { label: 'Just updated', className: 'bg-green-100 text-green-700' },
  'fresh': { label: 'Fresh', className: 'bg-green-100 text-green-700' },
  'in-season': { label: 'In season', className: 'bg-emerald-100 text-emerald-700' },
  'limited-stock': { label: 'Limited', className: 'bg-amber-100 text-amber-700' },
  'last-few': { label: 'Last few', className: 'bg-orange-100 text-orange-700' },
  'pre-order': { label: 'Pre-order', className: 'bg-blue-100 text-blue-700' },
  'available-soon': { label: 'Coming soon', className: 'bg-blue-100 text-blue-700' },
  'selling-fast': { label: 'Selling fast', className: 'bg-red-100 text-red-700' },
};

export function ProductHamburgerRow({ product }: ProductHamburgerRowProps) {
  const freshnessTags = deriveFreshnessTags({
    inventory: product.inventory,
    inventoryUpdatedAt: product.inventoryUpdatedAt,
    updatedAt: product.updatedAt,
    createdAt: product.createdAt,
    availableDate: product.availableDate,
    availableUntil: product.availableUntil,
  });

  const primaryTag = freshnessTags[0] ?? null;
  const tagStyle = primaryTag ? FRESHNESS_STYLES[primaryTag] : null;
  const hasDelivery = product.deliveryInfo?.isAvailable ?? false;
  const hasPickup = !!product.marketStand;

  const updatedAgo = formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true });

  return (
    <Link href={`/product/${encodeURIComponent(product.id)}`} className="block group">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
        {/* Thumbnail */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🌿</div>
          )}
          {/* Stock badge on image */}
          {product.inventory > 0 && product.inventory <= 10 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-medium">
              {product.inventory} left
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</p>
            <p className="font-bold text-[#0B4D2C] text-sm flex-shrink-0">
              ${(product.price / 100).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Freshness tag */}
            {tagStyle && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tagStyle.className}`}>
                {tagStyle.label}
              </span>
            )}

            {/* Fulfillment icons */}
            {hasPickup && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <ShoppingBag className="w-3 h-3" /> Pickup
              </span>
            )}
            {hasDelivery && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                <Truck className="w-3 h-3" /> Delivery
              </span>
            )}

            {/* Updated time */}
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 ml-auto">
              <Clock className="w-3 h-3" />
              {updatedAgo}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
