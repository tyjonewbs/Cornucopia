"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils/format";

interface ProductInventoryRowProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  initialInventory: number;
  lastRestocked?: string;
  onInventoryChange: (productId: string, newValue: number) => Promise<{ success: boolean; error?: string }>;
}

function formatLastRestocked(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ProductInventoryRow({
  product,
  initialInventory,
  lastRestocked,
  onInventoryChange,
}: ProductInventoryRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localInventory, setLocalInventory] = useState(initialInventory);

  const handleInventoryChange = (newValue: number) => {
    if (newValue < 0) return;
    setLocalInventory(newValue);
    startTransition(async () => {
      const result = await onInventoryChange(product.id, newValue);
      if (result.success) {
        router.refresh();
      } else {
        setLocalInventory(initialInventory);
        toast.error(result.error || "Failed to update inventory");
      }
    });
  };

  const isActive = localInventory > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
        isActive ? "border-green-200 bg-green-50" : "bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {product.images?.[0] ? (
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="rounded object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
            <Package className="h-4 w-4" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{product.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {formatPrice(product.price)}
            </p>
            {lastRestocked && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                Last Restocked: {formatLastRestocked(lastRestocked)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handleInventoryChange(localInventory - 1)}
          disabled={isPending || localInventory <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          value={localInventory}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) handleInventoryChange(val);
          }}
          className="h-8 w-16 text-center text-sm"
          min="0"
          disabled={isPending}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handleInventoryChange(localInventory + 1)}
          disabled={isPending}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
