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
  initialProducts: SerializedProduct[];
}

export function ProductRow({ title, link, initialProducts }: ProductRowProps) {
  const { userLocation, locationError } = useUserLocation();
  const [data, setData] = useState<SerializedProduct[]>(initialProducts);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (userLocation) {
        setIsLocalLoading(true);
        try {
          const products = await getHomeProducts(userLocation);
          setData(products);
        } catch (error) {
          logError('Error fetching products:', error);
        } finally {
          setIsLocalLoading(false);
          setHasInitialized(true);
        }
      } else {
        setHasInitialized(true);
      }
    };

    fetchData();
  }, [userLocation]);

  if (!hasInitialized) {
    return <LoadingState />;
  }

  // Only filter products once we have user location
  const localProducts = userLocation ? data.filter(product => (product.distance ?? Infinity) <= 150) : [];
  const nonLocalProducts = userLocation ? data.filter(product => (product.distance ?? Infinity) > 150) : data;
  const hasLocalProducts = localProducts.length > 0;
  const hasNonLocalProducts = nonLocalProducts.length > 0;

  const renderProductGrid = (products: SerializedProduct[]) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 mt-4 gap-10">
      {products.map((product) => (
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
  );

  return (
    <section className="mt-12">
      {/* Local Products Section */}
      <div className="mb-12">
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

        {isLocalLoading && !locationError ? (
          <div className="mt-4">
            <LoadingState />
          </div>
        ) : locationError ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50 mb-12">
            <h3 className="text-xl font-semibold mb-4">{locationError}</h3>
          </div>
        ) : userLocation && localProducts.length === 0 && (
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
