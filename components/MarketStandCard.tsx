"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, Clock, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

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
    _count?: {
      products: number;
    };
    lastProductUpdate?: Date | null;
  };
}

export function MarketStandCard({ stand }: MarketStandCardProps) {
  const [imageError, setImageError] = useState(false);
  
  if (!stand) {
    return null;
  }

  return (
    <Link href={`/market-stand/${stand.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex">
          {/* Image Section - Fixed width and aspect ratio */}
          <div className="relative w-72 h-48 bg-muted flex items-center justify-center">
            {stand.images[0] && !imageError ? (
              <Image
                src={stand.images[0]}
                alt={stand.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">Image not available</span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>{stand.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {stand.description}
              </p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {stand.locationName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {stand._count?.products || 0} products
                  </div>
                  {stand.lastProductUpdate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Updated {formatDistanceToNow(new Date(stand.lastProductUpdate), { addSuffix: true })}
                    </div>
                  )}
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
          </div>
        </div>
      </Card>
    </Link>
  );
}
