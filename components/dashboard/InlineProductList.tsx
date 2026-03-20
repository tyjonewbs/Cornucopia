"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { updateStandProductInventory, updateDeliveryProductInventory } from "@/app/actions/dashboard-products";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Product {
  listingId: string;
  productId: string;
  name: string;
  price: number;
  images: string[];
  inventory: number;
  updatedAt: string;
  status: string;
}

interface InlineProductListProps {
  products: Product[];
  mode: "stand" | "delivery";
  contextId: string; // standId or zoneId
  userId: string;
  onAddProduct?: () => void;
}

function InventoryControl({
  listingId,
  productId,
  contextId,
  mode,
  initialInventory,
  onUpdate,
}: {
  listingId: string;
  productId: string;
  contextId: string;
  mode: "stand" | "delivery";
  initialInventory: number;
  onUpdate: (newValue: number) => void;
}) {
  const [value, setValue] = useState(initialInventory);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (newValue: number) => {
      if (newValue < 0) return;
      setSaving(true);
      try {
        if (mode === "stand") {
          await updateStandProductInventory(listingId, newValue);
        } else {
          await updateDeliveryProductInventory(productId, contextId, newValue);
        }
        onUpdate(newValue);
      } catch {
        toast.error("Failed to update inventory");
        setValue(initialInventory);
      } finally {
        setSaving(false);
      }
    },
    [listingId, productId, contextId, mode, initialInventory, onUpdate]
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          const newVal = Math.max(0, value - 1);
          setValue(newVal);
          save(newVal);
        }}
        disabled={saving || value <= 0}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number"
        value={value}
        min={0}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        onBlur={() => save(value)}
        onKeyDown={(e) => e.key === "Enter" && save(value)}
        className="w-10 text-center text-sm border border-gray-300 rounded py-0.5 bg-white"
      />
      <button
        onClick={() => {
          const newVal = value + 1;
          setValue(newVal);
          save(newVal);
        }}
        disabled={saving}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export function InlineProductList({
  products,
  mode,
  contextId,
  onAddProduct,
}: InlineProductListProps) {
  const [expanded, setExpanded] = useState(false);
  const [inventories, setInventories] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.listingId, p.inventory]))
  );
  const router = useRouter();
  const SHOW_COUNT = 3;
  const visible = expanded ? products : products.slice(0, SHOW_COUNT);
  const hidden = products.length - SHOW_COUNT;

  if (products.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-3">No products yet</p>
        <button
          onClick={onAddProduct}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {visible.map((product) => (
          <div
            key={product.listingId}
            className="flex items-center gap-3 py-2.5"
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                  🌿
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm truncate">{product.name}</p>
                {product.status === "PENDING" && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Review
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                ${(product.price / 100).toFixed(2)} · Restocked{" "}
                {formatDistanceToNow(new Date(product.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {/* Inventory controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <InventoryControl
                listingId={product.listingId}
                productId={product.productId}
                contextId={contextId}
                mode={mode}
                initialInventory={inventories[product.listingId] ?? product.inventory}
                onUpdate={(newVal) => {
                  setInventories((prev) => ({
                    ...prev,
                    [product.listingId]: newVal,
                  }));
                  router.refresh();
                }}
              />
              <Link href={`/product/${product.productId}/edit`}>
                <Button variant="ghost" size="sm" className="text-xs px-2 h-7">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {products.length > SHOW_COUNT && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-500 hover:text-gray-700 mt-1 py-1"
        >
          {expanded ? "Show less ▴" : `Show ${hidden} more ▾`}
        </button>
      )}

      {/* Add product */}
      <div className="mt-3">
        <button
          onClick={onAddProduct}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>
    </div>
  );
}
