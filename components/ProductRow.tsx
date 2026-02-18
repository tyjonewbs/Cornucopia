'use client';

import { useState } from 'react';
import { ProductCard } from "./ProductCard";
import Link from "next/link";
import { type SerializedProduct } from "@/app/actions/home-products";

interface ProductRowProps {
  title: string;
  initialProducts: SerializedProduct[];
}

export function ProductRow({ title, initialProducts }: ProductRowProps) {
  const [isLocalLoading] = useState(false);

  // Use initialProducts directly and filter based on distance
  const data = initialProducts;
  const localProducts = data.filter(product => (product.distance ?? Infinity) <= 500);
  const nonLocalProducts = data.filter(product => (product.distance ?? Infinity) > 500);
  const hasLocalProducts = localProducts.length > 0;
  const hasNonLocalProducts = nonLocalProducts.length > 0;

  const renderProductGrid = (products: SerializedProduct[]) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 mt-4 gap-3 md:gap-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          images={product.images}
          id={product.id}
          name={product.name}
          locationName={product.marketStand?.locationName ?? ''}
          updatedAt={product.updatedAt}
          price={product.price}
          tags={product.tags}
        />
      ))}
    </div>
  );

  return (
    <section className="mt-12">
      {/* Local Products Section */}
      <div className="mb-12">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-extrabold tracking-tighter">
            {title}
          </h2>
        </div>

        {localProducts.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-muted/50 mb-12">
            <h3 className="text-xl font-semibold mb-4">Sorry, there are no local products nearby</h3>
            <Link 
              href="/market-stand/setup"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Become the First
            </Link>
          </div>
        )}

        {!isLocalLoading && hasLocalProducts && renderProductGrid(localProducts)}
      </div>

      {/* Non-Local Products Section */}
      {hasNonLocalProducts && (
        <div className="mt-16">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-extrabold tracking-tighter">
              Explore Products
            </h2>
          </div>
          {renderProductGrid(nonLocalProducts)}
        </div>
      )}
    </section>
  );
}
