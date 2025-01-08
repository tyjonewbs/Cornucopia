import { Card } from "./ui/card";
import { Button } from "./ui/button";
import Image from "next/image";
import { MapPin, Package, QrCode } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { MarketStandQR } from "./MarketStandQR";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  images: string[];
  updatedAt: Date;
}

interface MarketStandCardProps {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  distance?: number;
  products: Product[];
  user: {
    firstName: string;
    profileImage: string;
  };
}

export function MarketStandCard({
  id,
  name,
  description,
  images,
  latitude,
  longitude,
  locationName,
  locationGuide,
  distance,
  products,
  user,
}: MarketStandCardProps) {
  const [showQR, setShowQR] = useState(false);
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-16 aspect-h-9 relative">
        <Link href={`/market-stand/${encodeURIComponent(id)}`}>
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover"
          />
        </Link>
      </div>
      <div className="p-4">
        <Link href={`/market-stand/${encodeURIComponent(id)}`} className="block">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={user.profileImage}
              alt={user.firstName}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-muted-foreground">{user.firstName}&apos;s Stand</span>
          </div>
          
          <h3 className="text-lg font-semibold mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{locationName}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{locationGuide}</p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {distance ? `${distance.toFixed(1)} km away` : 'Distance unknown'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {products.length} products
            </div>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="ghost"
              size="sm"
              className="h-auto p-0 font-normal hover:bg-transparent"
              aria-label={showQR ? 'Hide QR code' : 'Show QR code'}
            >
              <QrCode className="h-4 w-4 mr-1" />
              <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
            </Button>
          </div>
        </div>

        {showQR && (
          <div className="mt-4 flex justify-center">
            <MarketStandQR marketStandId={id} />
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Latest Products:</h4>
            <div className="grid grid-cols-3 gap-2 h-24">
              {products.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  images={product.images}
                  locationName={locationName}
                  updatedAt={product.updatedAt}
                  marketStandId={id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
