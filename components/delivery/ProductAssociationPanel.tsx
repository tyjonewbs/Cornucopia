"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toggleProductInZone } from "@/app/actions/delivery-zones";
import { Package } from "lucide-react";
import { toast } from "sonner";

interface ProductWithZoneStatus {
  id: string;
  name: string;
  price: number;
  images: string[];
  inventory: number;
  isInZone: boolean;
}

interface ProductAssociationPanelProps {
  zoneId: string;
  zoneName: string;
  products: ProductWithZoneStatus[];
}

export function ProductAssociationPanel({
  zoneId,
  zoneName,
  products,
}: ProductAssociationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (productId: string) => {
    startTransition(async () => {
      const result = await toggleProductInZone(productId, zoneId);
      if (result.success) {
        toast.success(result.added ? "Product added to zone" : "Product removed from zone");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update product");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products
        </CardTitle>
        <CardDescription>
          Toggle which products are available for delivery in {zoneName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  product.isInZone ? "border-green-200 bg-green-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(product.price / 100).toFixed(2)} | Inventory: {product.inventory}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={product.isInZone}
                  onCheckedChange={() => handleToggle(product.id)}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <h3 className="font-medium mb-1">No products found</h3>
            <p className="text-sm">
              Create products first, then associate them with this delivery zone.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
