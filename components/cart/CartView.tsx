"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Truck, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { updateCartItemQuantity, removeFromCart } from "@/app/actions/cart";
import { groupCartItems, calculateCartTotals, formatPrice } from "@/lib/cart/calculations";
import type { Cart, CartGroup } from "@/types/cart";

interface CartViewProps {
  cart: Cart | null;
}

export function CartView({ cart }: CartViewProps) {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Browse products and add items to get started.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const groups = groupCartItems(cart);
  const totals = calculateCartTotals(cart);

  async function handleUpdateQuantity(itemId: string, newQuantity: number) {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await updateCartItemQuantity(itemId, newQuantity);
      if (!result.success) {
        toast.error(result.error || "Failed to update quantity");
      }
      router.refresh();
    } catch {
      toast.error("Failed to update quantity");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleRemoveItem(itemId: string) {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      const result = await removeFromCart(itemId);
      if (!result.success) {
        toast.error(result.error || "Failed to remove item");
      }
      router.refresh();
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleCheckout() {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cart groups */}
      {groups.map((group) => (
        <CartGroupCard
          key={group.key}
          group={group}
          updatingItems={updatingItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      ))}

      {/* Order summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})
            </span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          {totals.deliveryFees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fees</span>
              <span>{formatPrice(totals.deliveryFees)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span>{formatPrice(totals.tax)}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(totals.total)}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full mt-6"
          size="lg"
          onClick={handleCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Proceed to Checkout`
          )}
        </Button>
      </Card>
    </div>
  );
}

function CartGroupCard({
  group,
  updatingItems,
  onUpdateQuantity,
  onRemoveItem,
}: {
  group: CartGroup;
  updatingItems: Set<string>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  const isDelivery = group.type === "DELIVERY";

  return (
    <Card className="overflow-hidden">
      {/* Group header */}
      <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
        {isDelivery ? (
          <>
            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">
              Delivery {group.deliveryZone ? `- ${group.deliveryZone.name}` : ""}
            </span>
            {group.deliveryDate && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(group.deliveryDate).toLocaleDateString()}
              </span>
            )}
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">
              Pickup {group.marketStand ? `- ${group.marketStand.name}` : ""}
            </span>
            {group.pickupTime && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(group.pickupTime).toLocaleString()}
              </span>
            )}
          </>
        )}
      </div>

      {/* Items */}
      <div className="divide-y">
        {group.items.map((item) => {
          const isUpdating = updatingItems.has(item.id);
          return (
            <div key={item.id} className="p-4 flex gap-4">
              {/* Product image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {item.product.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatPrice(item.product.price)} each
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Decrease quantity of ${item.product.name}`}
                    disabled={isUpdating || item.quantity <= 1}
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">
                    {isUpdating ? (
                      <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                    ) : (
                      item.quantity
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Increase quantity of ${item.product.name}`}
                    disabled={
                      isUpdating || item.quantity >= item.product.inventory
                    }
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive ml-auto"
                    aria-label={`Remove ${item.product.name} from cart`}
                    disabled={isUpdating}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Line total */}
              <div className="text-right flex-shrink-0">
                <span className="font-medium text-sm">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group subtotal */}
      <div className="px-4 py-3 bg-muted/30 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatPrice(group.subtotal)}</span>
        </div>
        {isDelivery && group.deliveryFee > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span>{formatPrice(group.deliveryFee)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
