"use client";

import { useState } from "react";
import { ProductImageHeader } from "@/components/ProductImageHeader";
import { ProductTitleBar } from "@/components/ProductTitleBar";
import { AvailabilityDatesList } from "@/components/AvailabilityDatesList";
import { ProductDetailsGrid } from "@/components/ProductDetailsGrid";
import { NearbyProducts } from "@/components/NearbyProducts";
import { ProductDescription } from "@/components/ProductDescription";
import { ProductLocationMap } from "@/components/ProductLocationMap";
import { MarketStandHours } from "@/components/MarketStandHours";
import { QRPaymentCallout } from "@/components/QRPaymentCallout";
import { AlsoAvailableAtLink } from "@/components/AlsoAvailableAtLink";
import { DeliveryOptionsCard } from "@/components/DeliveryOptionsCard";
import { JSONContent } from "@tiptap/react";
import type { SerializedNearbyProduct } from "@/app/actions/nearby-products";

interface ProductPageClientProps {
  data: any; // We'll use 'any' for now since the types are complex
  nearbyProducts: SerializedNearbyProduct[];
}

export function ProductPageClient({ data, nearbyProducts }: ProductPageClientProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleBuyNow = () => {
    document.getElementById('location-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleToggleFavorite = async () => {
    // TODO: Implement favorite toggle with API
    setIsSaved(!isSaved);
  };

  const descriptionContent: JSONContent = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        type: 'text',
        text: data.description || ''
      }]
    }]
  };

  const deliveryDates = data.deliveryDates?.map((d: string) => new Date(d)) || [];
  const availableDate = data.availableDate ? new Date(data.availableDate) : null;
  const availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;

  return (
    <div className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8">
      {/* Product Images Header */}
      <ProductImageHeader 
        images={data.images}
        productName={data.name}
      />

      {/* Title Bar with Actions */}
      <ProductTitleBar
        productName={data.name}
        price={data.price}
        marketStand={data.marketStand ? {
          id: data.marketStand.id,
          name: data.marketStand.name,
          locationName: data.marketStand.locationName,
        } : null}
        isSaved={isSaved}
        onToggleFavorite={handleToggleFavorite}
        onBuyNow={handleBuyNow}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">
        {/* Left Column - Main Content */}
        <div className="space-y-8">
          {/* Availability Dates Section */}
          <AvailabilityDatesList
            deliveryDates={deliveryDates}
            availableDate={availableDate}
            availableUntil={availableUntil}
            deliveryAvailable={data.deliveryAvailable}
            hasPickup={!!data.marketStandId}
          />

          {/* Product Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Product Description</h3>
            <ProductDescription content={descriptionContent} />
          </div>

          {/* Product Details Grid */}
          <ProductDetailsGrid
            category={data.tags?.[0]}
            inventory={data.inventory}
            locationName={data.marketStand?.locationName || ''}
            city={data.marketStand?.city}
            zipCode={data.marketStand?.zipCode}
            updatedAt={data.updatedAt}
            averageRating={data.averageRating}
            totalReviews={data.totalReviews}
            tags={data.tags}
          />

          {/* Map/Location Section (Scroll Anchor) */}
          {data.marketStand && (
            <section id="location-section" className="scroll-mt-20">
              <h3 className="text-xl font-bold mb-4">Pick Up Location</h3>
              
              <ProductLocationMap
                standId={data.marketStand.id}
                standName={data.marketStand.name}
                latitude={data.marketStand.latitude}
                longitude={data.marketStand.longitude}
                locationName={data.marketStand.locationName}
              />

              <div className="mt-4 space-y-2">
                <p className="font-semibold">{data.marketStand.locationName}</p>
                {data.marketStand.streetAddress && (
                  <p className="text-muted-foreground">{data.marketStand.streetAddress}</p>
                )}
                {(data.marketStand.city || data.marketStand.zipCode) && (
                  <p className="text-muted-foreground">
                    {[data.marketStand.city, data.marketStand.zipCode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {data.marketStand.hours && (
                <div className="mt-4">
                  <MarketStandHours hours={data.marketStand.hours} />
                </div>
              )}

              {data.user?.connectedAccountId && (
                <div className="mt-4">
                  <QRPaymentCallout standName={data.marketStand.name} />
                </div>
              )}
            </section>
          )}

          {/* Alternative Stands */}
          {data.standListings && data.standListings.length > 0 && (
            <AlsoAvailableAtLink
              stands={data.standListings.map((l: any) => l.marketStand)}
              productName={data.name}
            />
          )}

          {/* Delivery Options Card */}
          {data.deliveryAvailable && data.deliveryZone && (
            <DeliveryOptionsCard
              productId={data.id}
              productName={data.name}
            />
          )}
        </div>

        {/* Right Sidebar - Nearby Products */}
        <div className="space-y-6">
          <NearbyProducts products={nearbyProducts} />
        </div>
      </div>
    </div>
  );
}
