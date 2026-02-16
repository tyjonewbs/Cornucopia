'use client';

import { ProductCard } from "@/components/ProductCard";
import { MarketStandCard } from "@/components/MarketStandCard";
import { LocalCard } from "@/components/LocalCard";
import { PromoBanner } from "@/components/PromoBanner";
import type { GeoSerializedProduct } from "@/lib/repositories/geoProductRepository";

interface MarketStand {
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
  _count?: {
    products: number;
  };
}

interface Farm {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationName: string;
  images: string[];
  distance: number | null;
  slug?: string;
  tagline?: string;
  _count: {
    products: number;
  };
}

interface ResponsiveProductGridProps {
  products: GeoSerializedProduct[];
  stands?: MarketStand[];
  farms?: Farm[];
  showPromoBanners?: boolean;
  userId?: string;
}

export function ResponsiveProductGrid({
  products,
  stands = [],
  farms = [],
  showPromoBanners = true,
}: ResponsiveProductGridProps) {
  // Create a mixed array with products and promotional banners
  const gridItems: JSX.Element[] = [];
  
  // Insert products with occasional promotional banners
  products.forEach((product, index) => {
    // Add product card
    gridItems.push(
      <ProductCard
        key={`product-${product.id}`}
        id={product.id}
        name={product.name}
        images={product.images}
        locationName={product.marketStand?.locationName || 'Delivery Only'}
        updatedAt={product.updatedAt}
        price={product.price}
        tags={product.tags}
        distance={product.distance}
        availableDate={product.availableDate}
        availableUntil={product.availableUntil}
        deliveryAvailable={product.deliveryAvailable}
        deliveryInfo={product.deliveryInfo}
        inventory={product.inventory}
      />
    );

    // Insert promotional banners strategically
    if (showPromoBanners) {
      // After every 4 products on mobile (2 rows), show a promo banner
      const shouldShowBanner = (index + 1) % 4 === 0;
      
      if (shouldShowBanner) {
        // Alternate between stands and farms
        const bannerIndex = Math.floor((index + 1) / 4) - 1;
        
        // Show market stand banner
        if (bannerIndex % 2 === 0 && stands.length > 0) {
          const stand = stands[bannerIndex % stands.length];
          gridItems.push(
            <PromoBanner
              key={`banner-stand-${stand.id}-${index}`}
              type="stand"
              title={stand.name}
              subtitle={stand.description || `${stand._count?.products || 0} products available`}
              description={stand.locationName}
              image={stand.images[0]}
              href={`/market-stand/${stand.id}`}
              distance={stand.distance}
              location={stand.locationName}
            />
          );
        }
        // Show farm banner
        else if (farms.length > 0) {
          const farm = farms[Math.floor(bannerIndex / 2) % farms.length];
          gridItems.push(
            <PromoBanner
              key={`banner-farm-${farm.id}-${index}`}
              type="product"
              title={farm.name}
              subtitle={farm.tagline || farm.description || `${farm._count.products} products`}
              description={farm.locationName}
              image={farm.images[0]}
              href={farm.slug ? `/local/${farm.slug}` : `/local/${farm.id}`}
              distance={farm.distance}
              location={farm.locationName}
            />
          );
        }
      }
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
      {gridItems}
    </div>
  );
}

// Alternative version that shows stands and farms as cards instead of banners
export function MixedResultsGrid({
  products,
  stands = [],
  farms = [],
  userId = "",
}: ResponsiveProductGridProps) {
  // Combine all results and sort by distance
  const allItems = [
    ...products.map(p => ({ type: 'product' as const, data: p, distance: p.distance })),
    ...stands.map(s => ({ type: 'stand' as const, data: s, distance: s.distance })),
    ...farms.map(f => ({ type: 'farm' as const, data: f, distance: f.distance })),
  ].sort((a, b) => {
    const distA = a.distance ?? Infinity;
    const distB = b.distance ?? Infinity;
    return distA - distB;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
      {allItems.map((item, index) => {
        if (item.type === 'product') {
          const product = item.data as GeoSerializedProduct;
          return (
            <ProductCard
              key={`product-${product.id}-${index}`}
              id={product.id}
              name={product.name}
              images={product.images}
              locationName={product.marketStand?.locationName || 'Delivery Only'}
              updatedAt={product.updatedAt}
              price={product.price}
              tags={product.tags}
              distance={product.distance}
              availableDate={product.availableDate}
              availableUntil={product.availableUntil}
              deliveryAvailable={product.deliveryAvailable}
              deliveryInfo={product.deliveryInfo}
              inventory={product.inventory}
            />
          );
        } else if (item.type === 'stand') {
          const stand = item.data as MarketStand;
          return (
            <div key={`stand-${stand.id}-${index}`} className="col-span-2">
              <MarketStandCard stand={stand} />
            </div>
          );
        } else {
          const farm = item.data as Farm;
          return (
            <LocalCard
              key={`farm-${farm.id}-${index}`}
              local={farm}
              userId={userId}
            />
          );
        }
      })}
    </div>
  );
}
