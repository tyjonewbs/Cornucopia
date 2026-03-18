'use client';

import Image from "next/image";
import Link from "next/link";
import { FreshnessBadge, deriveFreshnessTags } from "./FreshnessBadge";
import type { FreshnessTag } from "./FreshnessBadge";
import type { GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";

interface ProductTileProps {
  product: GeoSerializedProduct;
}

export function ProductTile({ product }: ProductTileProps) {
  const freshnessTags = deriveFreshnessTags({
    inventory: product.inventory,
    inventoryUpdatedAt: product.inventoryUpdatedAt,
    updatedAt: product.updatedAt,
    createdAt: product.createdAt,
    availableDate: product.availableDate,
    availableUntil: product.availableUntil,
  });

  // Admin-assigned tags take priority over auto-derived ones
  const adminTags = (product.adminTags || []) as FreshnessTag[];
  const allTags = Array.from(new Set([...adminTags, ...freshnessTags]));
  const primaryTag = allTags[0] ?? null;
  const secondaryTag = allTags[1] ?? null;
  const hasDelivery = product.deliveryInfo?.isAvailable ?? false;
  const hasPickup = !!product.marketStand;

  return (
    <Link
      href={`/product/${encodeURIComponent(product.id)}`}
      className="block group"
    >
      <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white border border-gray-100">
        {/* Image section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* Floating freshness badges */}
          {primaryTag && (
            <FreshnessBadge
              tag={primaryTag}
              count={primaryTag === 'limited-stock' || primaryTag === 'last-few' ? product.inventory : undefined}
              position="top-left"
            />
          )}
          {secondaryTag && (
            <FreshnessBadge
              tag={secondaryTag}
              count={secondaryTag === 'limited-stock' || secondaryTag === 'last-few' ? product.inventory : undefined}
              position="top-right"
              size="sm"
            />
          )}

          {/* Inventory count - top right (only if no secondary badge occupies the spot) */}
          {!secondaryTag && product.inventory > 0 && product.inventory <= 20 && !primaryTag?.includes('stock') && !primaryTag?.includes('few') && (
            <div className="absolute top-2 right-2 z-10 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
              {product.inventory} left
            </div>
          )}

          <Image
            alt={product.name}
            src={product.images[0] || '/placeholder-product.jpg'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />

          {/* Fulfillment indicators - bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-0">
            {hasPickup && (
              <div className="flex-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-medium py-1 text-center">
                Pickup
              </div>
            )}
            {hasDelivery && (
              <div className="flex-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-medium py-1 text-center">
                Delivery
              </div>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="p-2.5">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1 text-gray-900">
              {product.name}
            </h3>
            {typeof product.price === 'number' && (
              <span className="font-bold text-sm text-emerald-700 whitespace-nowrap">
                {(product.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            )}
          </div>

          {/* Location */}
          {product.marketStand && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {product.marketStand.locationName}
              {product.distance != null && (
                <span className="text-emerald-600 ml-1">
                  {Math.round(product.distance * 0.621371)} mi
                </span>
              )}
            </p>
          )}

          {/* Tags row */}
          {product.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 overflow-hidden">
              {product.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 2 && (
                <span className="text-gray-400 text-[10px] py-0.5">
                  +{product.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
