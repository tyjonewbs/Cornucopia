import { Card } from "./ui/card";
import { Button } from "./ui/button";
import Image from "next/image";
import { Package } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

interface Product {
  id: string;
  name: string;
  images: string[];
  updatedAt: Date;
}

interface MarketStandCardProps {
  id: string;
  name: string;
  description: string | null | undefined;
  images: string[];
  locationName: string; // Kept for ProductCard
  products: Product[];
}

export function MarketStandCard({
  id,
  name,
  description,
  images,
  locationName,
  products,
}: MarketStandCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
<Link href={`/market-stand/${encodeURIComponent(id)}`} className="block">
  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg">
    <Image
      src={images[0]}
      alt={name}
      fill
      className="object-cover transition-transform hover:scale-105"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={true}
    />
  </div>
</Link>
      <div className="p-4">
        <Link href={`/market-stand/${encodeURIComponent(id)}`} className="block">
          <h3 className="text-lg font-semibold mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Package className="h-4 w-4" />
          {products.length} products
        </div>

        {products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Latest Products:</h4>
            <div className="grid grid-cols-2 gap-4">
              {products.slice(0, 2).map((product) => (
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
