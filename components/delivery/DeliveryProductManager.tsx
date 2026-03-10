"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  addProductToDelivery,
  removeProductFromDelivery,
  updateDeliveryProductCap,
} from "@/app/actions/deliveries";
import type { DeliveryProductInfo } from "@/types/delivery";
import { toast } from "sonner";

interface DeliveryProductManagerProps {
  deliveryId: string;
  existingProducts: DeliveryProductInfo[];
  userProducts: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  }>;
  onUpdate?: () => void;
}

export function DeliveryProductManager({
  deliveryId,
  existingProducts,
  userProducts,
  onUpdate,
}: DeliveryProductManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const existingProductIds = new Set(existingProducts.map(dp => dp.productId));
  const availableProducts = userProducts.filter(p => !existingProductIds.has(p.id));

  const handleAdd = (productId: string) => {
    startTransition(async () => {
      const result = await addProductToDelivery(deliveryId, productId);
      if (result.success) {
        toast.success("Product added");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to add product");
      }
    });
  };

  const handleRemove = (productId: string) => {
    startTransition(async () => {
      const result = await removeProductFromDelivery(deliveryId, productId);
      if (result.success) {
        toast.success("Product removed");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to remove product");
      }
    });
  };

  const handleCapChange = (productId: string, value: string) => {
    const cap = value === "" ? null : parseInt(value, 10);
    if (cap !== null && isNaN(cap)) return;

    startTransition(async () => {
      const result = await updateDeliveryProductCap(deliveryId, productId, cap);
      if (result.success) {
        toast.success("Cap updated");
        onUpdate?.();
      } else {
        toast.error(result.error || "Failed to update cap");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={availableProducts.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product to Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {availableProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All products are already added.
              </p>
            ) : (
              availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border p-3"
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
                  <Button
                    size="sm"
                    onClick={() => handleAdd(product.id)}
                    disabled={isPending}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline cap editing for existing products */}
      {existingProducts.length > 0 && (
        <div className="space-y-1">
          {existingProducts.map((dp) => (
            <div
              key={dp.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate flex-1">{dp.product.name}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Cap:</label>
                <Input
                  type="number"
                  className="h-7 w-16 text-xs"
                  placeholder="--"
                  defaultValue={dp.cap !== null ? dp.cap : ""}
                  onBlur={(e) => handleCapChange(dp.productId, e.target.value)}
                  min={0}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemove(dp.productId)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
