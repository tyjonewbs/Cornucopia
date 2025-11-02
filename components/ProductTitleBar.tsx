"use client";

import Link from "next/link";
import { MapPin, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductTitleBarProps {
  productName: string;
  price: number;
  marketStand: {
    id: string;
    name: string;
    locationName?: string | null;
  } | null;
  isSaved?: boolean;
  onToggleFavorite?: () => void;
  onBuyNow?: () => void;
}

export function ProductTitleBar({
  productName,
  price,
  marketStand,
  isSaved = false,
  onToggleFavorite,
  onBuyNow,
}: ProductTitleBarProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on Cornucopia`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
      {/* Left Side - Product Info */}
      <div className="flex-1 space-y-3">
        {/* Product Name */}
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
          {productName}
        </h1>

        {/* Market Stand Name */}
        {marketStand && (
          <Link
            href={`/market-stand/${marketStand.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <MapPin className="w-4 h-4 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium">{marketStand.name}</span>
            {marketStand.locationName && (
              <span className="text-sm text-muted-foreground">
                • {marketStand.locationName}
              </span>
            )}
          </Link>
        )}

        {/* Price */}
        <p className="text-3xl font-bold text-green-600">
          ${(price / 100).toFixed(2)}
        </p>
      </div>

      {/* Right Side - Action Buttons */}
      <div className="flex flex-col gap-3 lg:min-w-[200px]">
        {/* Buy Now Button */}
        <Button
          size="lg"
          className="w-full font-semibold"
          onClick={onBuyNow}
        >
          Buy Now
        </Button>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          {/* Add to Favorite Button */}
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onToggleFavorite}
          >
            <Heart
              className={`w-4 h-4 mr-2 ${isSaved ? "fill-current text-red-500" : ""}`}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>

          {/* Share Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
