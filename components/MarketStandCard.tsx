"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Clock, Image as ImageIcon, Pencil } from "lucide-react";
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
    isOpen?: boolean;
    lastCheckedIn?: Date | string | null;
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

  // Format last check-in time if available
  const getLastCheckedInText = () => {
    if (!stand.lastCheckedIn) return null;
    const checkedIn = new Date(stand.lastCheckedIn);
    const now = new Date();
    const diffMs = now.getTime() - checkedIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Checked in recently';
    if (diffHours < 24) return `Checked in ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `Checked in ${diffDays}d ago`;
  };

  const lastCheckedInText = getLastCheckedInText();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section - Full width on mobile, fixed width on desktop */}
        <Link href={`/market-stand/${stand.id}`} className="block">
          <div className="relative w-full sm:w-72 h-48 bg-muted flex items-center justify-center cursor-pointer">
            {stand.images[0] && !imageError ? (
              <Image
                src={stand.images[0]}
                alt={stand.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">Image not available</span>
              </div>
            )}
          </div>
        </Link>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate">{stand.name}</CardTitle>
                  {stand.isOpen !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        stand.isOpen
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {stand.isOpen ? (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                          Open Now
                        </span>
                      ) : (
                        "Closed"
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {stand.description}
                </p>
              </div>
              <Link href={`/dashboard/market-stand/setup/edit/${stand.id}`}>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Pencil className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate max-w-[200px]">{stand.locationName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 flex-shrink-0" />
                    {stand._count?.products || 0} {(stand._count?.products || 0) === 1 ? 'product' : 'products'}
                  </div>
                  {lastCheckedInText && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      {lastCheckedInText}
                    </div>
                  )}
                  {!lastCheckedInText && stand.lastProductUpdate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
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
  );
}
