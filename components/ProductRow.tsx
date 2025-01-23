'use client';

import { LoadingProductCard, ProductCard } from "./ProductCard";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { getHomeProducts } from "@/app/actions/home-products";
import { logError } from "@/lib/logger";

interface SerializedProduct {
  id: string;
  name: string;
  images: string[];
  updatedAt: string;
  price: number;
  tags: string[];
  locationName: string;
  distance?: number;
  marketStand: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface ProductRowProps {
  title: string;
  link: string;
  userLocation?: { lat: number; lng: number } | null;
}


function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


export function ProductRow({ title, link }: Omit<ProductRowProps, 'userLocation'>) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [data, setData] = useState<SerializedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLocationError = (error: GeolocationPositionError) => {
    // Handle specific geolocation errors
    switch (error.code) {
      case error.PERMISSION_DENIED:
        logError('Location access denied by user', error);
        break;
      case error.POSITION_UNAVAILABLE:
        logError('Location information unavailable', error);
        break;
      case error.TIMEOUT:
        logError('Location request timed out', error);
        break;
      default:
        logError('An unknown error occurred', error);
    }
    setUserLocation(null);
  };

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error: GeolocationPositionError) => {
          logError('Error getting location:', error);
          setUserLocation(null);
        }
      );
    }
  }, []);

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
        {(hasLocalProducts ? localProducts : data).map((product: SerializedProduct) => (
          <ProductCard
            key={product.id}
            images={product.images}
            id={product.id}
            name={product.name}
            locationName={product.locationName}
            updatedAt={product.updatedAt}
            marketStandId={product.marketStand.id}
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
