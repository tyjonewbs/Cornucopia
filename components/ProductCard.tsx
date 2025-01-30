'use client';

import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ProductCardProps {
  images: string[];
  name: string;
  id: string;
  locationName: string;
  updatedAt: string;
  inventory?: number;
  isQRAccess?: boolean;
  price?: number;
  tags?: string[];
  distance?: number | null;
}

export function ProductCard({
  images,
  id,
  name,
  locationName,
  updatedAt,
  inventory,
  isQRAccess = false,
  price,
  tags = [],
  distance,
}: ProductCardProps) {
  const [timeElapsed, setTimeElapsed] = useState('00:00');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const updated = new Date(updatedAt);
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000); // difference in seconds
      
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      // First hour: show minutes:seconds
      if (diff < 3600) {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      // Next two days: show hours:minutes
      else if (days < 2) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      // After two days: show days
      else {
        return `${days}d ago`;
      }
    };

    // Initial calculation
    setTimeElapsed(calculateTime());

    // Update every second
    const interval = setInterval(() => {
      setTimeElapsed(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [updatedAt]);

  return (
    <Link 
      href={`/product/${encodeURIComponent(id)}${isQRAccess ? '?qr=true' : ''}`}
      className="block group"
    >
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <div className="relative aspect-[4/3] w-full">
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-mono">
              {timeElapsed}
            </div>
            {typeof inventory === 'number' && (
              <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm">
                {inventory} left
              </div>
            )}
          </div>
          <Image
            alt={name}
            src={images[0]}
            fill
            className="object-cover rounded-t-lg transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
        </div>
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{name}</h2>
            {typeof price === 'number' && (
              <p className="font-medium text-primary">
                {(price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-600 text-sm">{locationName}</p>
            {distance !== null && distance !== undefined && (
              <p className="text-sm text-primary">
                {Math.round(distance * 0.621371)} miles away
              </p>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag: string, index: number) => (
                <div
                  key={index}
                  className="bg-secondary px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function LoadingProductCard() {
  return (
    <div className="rounded-lg overflow-hidden shadow-md">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
