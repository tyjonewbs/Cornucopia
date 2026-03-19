"use client";

import { useState } from "react";
import { ProductImageHeader } from "@/components/ProductImageHeader";
import { ProductTitleBar } from "@/components/ProductTitleBar";
import { ProductDetailsGrid } from "@/components/ProductDetailsGrid";
import { NearbyProducts } from "@/components/NearbyProducts";
import { ProductDescription } from "@/components/ProductDescription";
import { ProducerCard } from "@/components/ProducerCard";
import { WhereToGetIt } from "@/components/WhereToGetIt";
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

  return (
    <div className="mx-auto px-4 pt-4 lg:mt-6 max-w-7xl lg:px-8">
      {/* Back button */}
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Back
      </button>
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
          isOpen: data.marketStand.isOpen,
        } : null}
        isSaved={isSaved}
        onToggleFavorite={handleToggleFavorite}
        onBuyNow={handleBuyNow}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">
        {/* Left Column - Main Content */}
        <div className="space-y-8">
          {/* Where to Get It Section - Unified purchase/location component */}
          <WhereToGetIt data={data} />

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

          {/* Producer/Farm Card */}
          {data.local && (
            <ProducerCard local={data.local} />
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
