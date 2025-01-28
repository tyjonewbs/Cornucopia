'use client';

import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { getHomeProducts } from "@/app/actions/home-products";
import { logError } from "@/lib/logger";
import type { SerializedProduct } from "@/app/actions/home-products";

export function NewestProducts() {
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getHomeProducts(null); // Pass null to get all products without location filtering
        setProducts(data);
      } catch (err) {
        logError('Failed to fetch newest products:', err);
        setError('Failed to load products. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tighter">
          Newest Products
        </h2>
        <Link
          href="/market-stand"
          className="text-sm hidden font-medium text-primary hover:text-primary/90 md:block"
        >
          All Products <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 mt-4 gap-10">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            images={product.images}
            id={product.id}
            name={product.name}
            locationName={product.marketStand.locationName}
            updatedAt={product.updatedAt}
            price={product.price}
            tags={product.tags}
          />
        ))}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="mt-12">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 hidden md:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="w-full aspect-[4/3]" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
