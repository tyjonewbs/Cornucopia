"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  toggleStandOpen,
  recordCashPurchase,
  createQRCheckoutSession,
  updateStandProductInventory,
} from "@/app/actions/stand-portal";

// Helper to get today's hours
function getTodayHours(hours: Record<string, any> | null | undefined): { open: string; close: string } | null {
  if (!hours) return null;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const todaySchedule = hours[currentDay];

  if (!todaySchedule || !todaySchedule.isOpen || !todaySchedule.timeSlots || todaySchedule.timeSlots.length === 0) {
    return null;
  }

  const firstSlot = todaySchedule.timeSlots[0];
  return {
    open: firstSlot.open,
    close: firstSlot.close,
  };
}

// Format time from 24h to 12h
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  inventory: number;
  listingId: string;
}

interface Stand {
  id: string;
  name: string;
  description: string | null;
  locationName: string;
  isOpen: boolean;
  userId: string;
  hours?: any;
}

interface Seller {
  connectedAccountId: string | null;
  stripeConnectedLinked: boolean;
}

interface StandPortalClientProps {
  stand: Stand;
  products: Product[];
  seller: Seller;
  isOwner: boolean;
  currentUserId: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  listingId: string;
  image: string;
}

export default function StandPortalClient({
  stand,
  products: initialProducts,
  seller,
  isOwner,
  currentUserId,
}: StandPortalClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(stand.isOpen);
  const [isToggling, setIsToggling] = useState(false);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [inventoryEdits, setInventoryEdits] = useState<Map<string, number>>(new Map());
  const [products, setProducts] = useState(initialProducts);

  // Show success message if redirected from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Thank you for your purchase.");
      // Clear the query param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const todayHours = getTodayHours(stand.hours);

  const handleToggleOpen = async () => {
    setIsToggling(true);
    const result = await toggleStandOpen(stand.id);

    if (result.error) {
      toast.error(result.error);
    } else if (result.isOpen !== undefined) {
      setIsOpen(result.isOpen);
      toast.success(result.isOpen ? "Stand is now open" : "Stand is now closed");
      router.refresh();
    }

    setIsToggling(false);
  };

  const addToCart = (product: Product) => {
    const newCart = new Map(cart);
    const existing = newCart.get(product.id);

    if (existing) {
      if (existing.quantity >= product.inventory) {
        toast.error("Not enough inventory");
        return;
      }
      existing.quantity += 1;
    } else {
      newCart.set(product.id, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        listingId: product.listingId,
        image: product.images[0] || "",
      });
    }

    setCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = new Map(cart);
    const existing = newCart.get(productId);

    if (existing && existing.quantity > 1) {
      existing.quantity -= 1;
    } else {
      newCart.delete(productId);
    }

    setCart(newCart);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      const newCart = new Map(cart);
      newCart.delete(productId);
      setCart(newCart);
      return;
    }

    if (quantity > product.inventory) {
      toast.error("Not enough inventory");
      return;
    }

    const newCart = new Map(cart);
    const existing = newCart.get(productId);
    if (existing) {
      existing.quantity = quantity;
      setCart(newCart);
    }
  };

  const handleCashPurchase = async () => {
    if (cart.size === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);

    const items = Array.from(cart.values()).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: item.price,
      listingId: item.listingId,
    }));

    const result = await recordCashPurchase({
      standId: stand.id,
      items,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Cash purchase recorded!");
      setCart(new Map());
      router.refresh();
    }

    setIsCheckingOut(false);
  };

  const handleCardCheckout = async () => {
    if (cart.size === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);

    const items = Array.from(cart.values()).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      listingId: item.listingId,
    }));

    const result = await createQRCheckoutSession({
      standId: stand.id,
      items,
    });

    if (result.error) {
      toast.error(result.error);
      setIsCheckingOut(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  };

  const handleInventoryEdit = (productId: string, newValue: number) => {
    const newEdits = new Map(inventoryEdits);
    newEdits.set(productId, newValue);
    setInventoryEdits(newEdits);
  };

  const handleSaveInventory = async () => {
    let successCount = 0;
    let errorCount = 0;

    for (const [productId, newInventory] of Array.from(inventoryEdits.entries())) {
      const result = await updateStandProductInventory(stand.id, productId, newInventory);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} product(s)`);
      setInventoryEdits(new Map());
      setEditMode(false);
      router.refresh();
    }

    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} product(s)`);
    }
  };

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getInventoryBadgeColor = (inventory: number) => {
    if (inventory === 0) return "bg-gray-200 text-gray-700";
    if (inventory <= 5) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  const getInventoryText = (inventory: number) => {
    if (inventory === 0) return "Out of stock";
    if (inventory <= 5) return "Last few";
    return `${inventory} left`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{stand.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{stand.locationName}</span>
              </div>
              {stand.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {stand.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isOpen ? "Open" : "Closed"}
                </div>
                {isOwner && (
                  <>
                    <Button
                      onClick={handleToggleOpen}
                      disabled={isToggling}
                      size="sm"
                      variant="outline"
                    >
                      {isToggling
                        ? "Updating..."
                        : isOpen
                        ? "Close Stand"
                        : "Open Stand"}
                    </Button>
                    {!isOpen && todayHours && !isToggling && (
                      <p className="text-xs text-gray-500 text-right">
                        Auto-closes at {formatTime(todayHours.close)}
                      </p>
                    )}
                    {!isOpen && !todayHours && !isToggling && (
                      <p className="text-xs text-gray-500 text-right">
                        Stays open until you close it
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Not logged in banner */}
      {!currentUserId && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-4 py-3 text-center">
            <p className="text-sm text-blue-800">
              <Link href="/login" className="font-medium underline">
                Sign in
              </Link>{" "}
              to purchase products
            </p>
          </div>
        </div>
      )}

      {/* Stand closed banner */}
      {!isOpen && !isOwner && (
        <div className="bg-gray-100 border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 text-center">
            <p className="text-sm text-gray-700 font-medium">
              This stand is currently closed
            </p>
          </div>
        </div>
      )}

      {/* Owner controls */}
      {isOwner && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-900">
                <span className="font-medium">Owner View</span>
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button
                      onClick={handleSaveInventory}
                      size="sm"
                      disabled={inventoryEdits.size === 0}
                    >
                      Save Inventory
                    </Button>
                    <Button
                      onClick={() => {
                        setEditMode(false);
                        setInventoryEdits(new Map());
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)} size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Inventory
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at this stand</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const cartItem = cart.get(product.id);
              const isOutOfStock = product.inventory === 0;
              const showControls = isOpen && currentUserId && !isOutOfStock;
              const currentInventory = inventoryEdits.get(product.id) ?? product.inventory;

              return (
                <Card
                  key={product.id}
                  className={isOutOfStock ? "opacity-60" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product image */}
                      <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {product.name}
                            </h3>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <div>
                            {editMode && isOwner ? (
                              <Input
                                type="number"
                                min="0"
                                value={currentInventory}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  handleInventoryEdit(
                                    product.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 h-8 text-sm"
                              />
                            ) : (
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getInventoryBadgeColor(
                                  product.inventory
                                )}`}
                              >
                                {getInventoryText(product.inventory)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        {showControls && !editMode && (
                          <div className="flex items-center gap-2 mt-3">
                            {/* Quantity selector */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => removeFromCart(product.id)}
                                disabled={!cartItem}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                max={product.inventory}
                                value={cartItem?.quantity ?? 0}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  updateCartQuantity(
                                    product.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 h-8 text-center text-sm"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => addToCart(product)}
                                disabled={
                                  (cartItem?.quantity ?? 0) >= product.inventory
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Stand closed message shown globally, not per-card */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart */}
      {cart.size > 0 && currentUserId && isOpen && !editMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">
                  {cart.size} item{cart.size !== 1 ? "s" : ""}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(cartTotal)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCashPurchase}
                  disabled={isCheckingOut}
                  variant="outline"
                  size="lg"
                >
                  Pay Cash
                </Button>
                <Button
                  onClick={handleCardCheckout}
                  disabled={isCheckingOut || !seller.stripeConnectedLinked}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCheckingOut ? "Processing..." : "Pay Card"}
                </Button>
              </div>
            </div>
            {!seller.stripeConnectedLinked && (
              <p className="text-xs text-gray-500 text-center">
                Card payments not available for this stand
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
