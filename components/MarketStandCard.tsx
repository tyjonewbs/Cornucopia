"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  userId?: string;
}

export function MarketStandCard({ stand, userId }: MarketStandCardProps) {
  if (!stand) {
    return null;
  }

  return (
    <div className="group">
      <Card className="h-full hover:shadow-lg transition-shadow relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{stand.name}</CardTitle>
          {userId && (
            <Link 
              href={`/market-stand/${stand.id}/edit`}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit market stand</span>
              </Button>
            </Link>
          )}
        </CardHeader>
        <Link href={`/market-stand/${stand.id}`}>
          <CardContent>
            {stand.images[0] && (
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
              {stand.tags.length > 0 && (
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
        </Link>
      </Card>
    </div>
  );
}
