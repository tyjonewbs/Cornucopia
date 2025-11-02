"use client";

import { ProductCard } from "@/components/ProductCard";
import type { SerializedNearbyProduct } from "@/app/actions/nearby-products";

interface NearbyProductsProps {
  products: SerializedNearbyProduct[];
}

export function NearbyProducts({ products }: NearbyProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-4">
      <h3 className="font-semibold text-lg">Nearby</h3>
      
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            images={product.images}
            locationName={product.marketStand?.locationName || ''}
            updatedAt={product.updatedAt}
            inventory={product.inventory}
            price={product.price}
            tags={product.tags}
            distance={product.distance}
            availableDate={product.availableDate}
            availableUntil={product.availableUntil}
            deliveryAvailable={product.deliveryAvailable}
            availableAt={product.availableAt}
          />
        ))}
      </div>
    </aside>
  );
}
