"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface MarketStandCardProps {
  stand: {
    id: string;
    name: string;
    description: string | null;
    locationName: string;
    locationGuide: string;
    latitude: number;
    longitude: number;
    images: string[];
    tags: string[];
    _count: {
      products: number;
    };
  };
}

export function MarketStandCard({ stand }: MarketStandCardProps) {
  if (!stand) {
    return null;
  }

  return (
    <Link href={`/market-stand/${stand.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card key={stand.id} className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{stand.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {stand.images?.[0] && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
              <Image
                src={stand.images[0]}
                alt={stand.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            {stand.description}
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {stand.locationName}
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {stand._count.products} products
              </div>
            </div>
            {stand.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stand.tags.map((tag, index) => (
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
        </CardContent>
      </Card>
    </Link>
  );
}
