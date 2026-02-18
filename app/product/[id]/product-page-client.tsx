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
import { ProducerCard } from "@/components/ProducerCard";
import { ProductAvailabilitySection } from "@/components/ProductAvailabilitySection";
import { DeliveryOptionsCard } from "@/components/DeliveryOptionsCard";
import { AuthDialog } from "@/components/AuthDialog";
import { JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import { toggleSavedProduct } from "@/app/actions/saved-products";
import type { SerializedNearbyProduct } from "@/app/actions/nearby-products";

interface ProductPageClientProps {
  data: any; // We'll use 'any' for now since the types are complex
  nearbyProducts: SerializedNearbyProduct[];
  initialSaved?: boolean;
}

export function ProductPageClient({ data, nearbyProducts, initialSaved = false }: ProductPageClientProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleBuyNow = () => {
    document.getElementById('location-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleToggleFavorite = async () => {
    const result = await toggleSavedProduct(data.id);
    if (result.error === "NOT_AUTHENTICATED") {
      setShowAuthDialog(true);
      return;
    }
    setIsSaved(result.saved);
    toast.success(result.saved ? "Product saved!" : "Product removed from saved");
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
            deliveryAvailable={data.deliveryAvailable}
            hasDeliveryInventory={data.deliveryListings?.some((listing: any) => listing.inventory > 0) || false}
          />

          {/* Delivery Options Card - Show prominently for delivery-only products */}
          {data.deliveryAvailable && !data.marketStandId && (
            <section id="location-section" className="scroll-mt-20">
              <h3 className="text-xl font-bold mb-4">Delivery Options</h3>
              {data.deliveryZone ? (
                <DeliveryOptionsCard
                  productId={data.id}
                  productName={data.name}
                />
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-900 mb-2">
                        Delivery Configuration Error
                      </h4>
                      <p className="text-sm text-red-800 mb-3">
                        This product is marked as delivery-available but no delivery zone has been configured. Please contact the seller to resolve this issue.
                      </p>
                      <p className="text-xs text-red-700">
                        Product ID: {data.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

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

          {/* Producer/Farm Card */}
          {data.local && (
            <ProducerCard local={data.local} />
          )}

          {/* Alternative Stands */}
          {data.standListings && data.standListings.length > 0 && (
            <ProductAvailabilitySection
              stands={data.standListings.map((l: any) => l.marketStand)}
              productName={data.name}
            />
          )}

          {/* Delivery Options Card for hybrid products (has both pickup and delivery) */}
          {data.deliveryAvailable && data.marketStandId && (
            <div>
              <h3 className="text-xl font-bold mb-4">Delivery Options</h3>
              {data.deliveryZone ? (
                <DeliveryOptionsCard
                  productId={data.id}
                  productName={data.name}
                />
              ) : (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Delivery is marked as available but not properly configured.
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Please use pickup option or contact the seller.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Nearby Products */}
        <div className="space-y-6">
          <NearbyProducts products={nearbyProducts} />
        </div>
      </div>

      {/* Auth dialog for unauthenticated save attempts */}
      <AuthDialog
        mode="login"
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  );
}
