import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OtherProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  inventory: number;
}

interface OtherProductsFromStandProps {
  standName: string;
  standId: string;
  products: OtherProduct[];
}

export function OtherProductsFromStand({
  standName,
  standId,
  products,
}: OtherProductsFromStandProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          More from {standName}
        </h3>
        <Link
          href={`/market-stand/${standId}`}
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video w-full">
                <Image
                  src={product.images[0] || "/placeholder.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <CardContent className="p-4">
                <h4 className="font-medium line-clamp-2 mb-2">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-600">
                    ${(product.price / 100).toFixed(2)}
                  </p>
                  {product.inventory > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {product.inventory} available
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Out of stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </aside>
  );
}
