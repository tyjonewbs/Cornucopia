'use client';

import { useState, useEffect } from 'react';
import { LoadingProductCard, ProductCard } from "./ProductCard";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import { getHomeProducts, type SerializedProduct } from "@/app/actions/home-products";
import { logError } from "@/lib/logger";
import useUserLocation from "@/app/hooks/useUserLocation";

interface ProductRowProps {
  title: string;
  link: string;
}

export function ProductRow({ title, link }: ProductRowProps) {
  const { userLocation } = useUserLocation();
  const [data, setData] = useState<SerializedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const products = await getHomeProducts(userLocation);
        setData(products);
      } catch (error) {
        logError('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userLocation]);

  if (isLoading) {
    return <LoadingState />;
  }

  // Check if there are any local products (within 150 miles)
  const localProducts = userLocation ? data.filter(product => (product.distance ?? Infinity) <= 150) : [];
  const hasLocalProducts = localProducts.length > 0;

  return (
    <section className="mt-12">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-extrabold tracking-tighter">
          {title}
        </h2>
        <Link
          href={link}
          className="text-sm hidden font-medium text-primary hover:text-primary/90 md:block"
        >
          All Products <span>&rarr;</span>
        </Link>
      </div>

      {userLocation && !hasLocalProducts && (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 mt-4 gap-10">
        {(hasLocalProducts ? localProducts : data).map((product) => (
          <ProductCard
            key={product.id}
            images={product.images}
            id={product.id}
            name={product.name}
            locationName={product.marketStand.locationName}
            updatedAt={product.updatedAt.toISOString()}
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
    <div>
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 gap-10 lg:grid-cols-3">
        <LoadingProductCard />
        <LoadingProductCard />
        <LoadingProductCard />
      </div>
    </div>
  );
}
