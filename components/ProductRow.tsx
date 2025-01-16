import { LoadingProductCard, ProductCard } from "./ProductCard";
import Link from "next/link";
import { Suspense } from "react";
import { cache } from 'react';
import { Skeleton } from "./ui/skeleton";
import prisma from "../lib/db";
import type { Product, MarketStand } from "@prisma/client";

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

const getData = cache(async ({ userLocation }: { userLocation?: { lat: number; lng: number } | null }) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        id: true,
        images: true,
        updatedAt: true,
        price: true,
        tags: true,
        marketStand: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          }
        }
      },
      take: 6,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Serialize dates and transform data
    const serializedProducts = products.map(product => ({
      ...product,
      updatedAt: product.updatedAt.toISOString(),
      locationName: product.marketStand?.name || 'Unknown Location',
      distance: userLocation && userLocation.lat && userLocation.lng && product.marketStand
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.marketStand.latitude,
            product.marketStand.longitude
          )
        : undefined
    }));

    return serializedProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
});

export function ProductRow({ title, link, userLocation }: ProductRowProps) {
  return (
    <section className="mt-12">
      <Suspense fallback={<LoadingState />}>
        <LoadRows title={title} link={link} userLocation={userLocation} />
      </Suspense>
    </section>
  );
}

async function LoadRows({ title, link, userLocation }: ProductRowProps) {
  const data = await getData({ userLocation });
  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 mt-4 gap-10">
        {data.map((product: SerializedProduct) => (
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
    </>
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
