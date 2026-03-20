'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Minus, Plus, Loader2 } from "lucide-react";
import {
  getStandProducts,
  getDeliveryZoneProducts,
  updateStandProductInventory,
  updateDeliveryProductInventory,
  getAvailableProducts,
  addProductToStand,
  addProductToDeliveryZone
} from "@/app/actions/dashboard-products";

interface ProductSheetProps {
  mode: 'stand' | 'delivery';
  contextId: string;
  contextName: string;
  userId: string;
  trigger: React.ReactNode;
}

interface ProductData {
  listingId?: string;
  productId: string;
  name: string;
  price: number;
  images: string[];
  status: string;
  isActive: boolean;
  inventory: number;
  sold: number;
  updatedAt: Date;
  timeAgo: string;
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  inventory: number;
}

export function ProductSheet({ mode, contextId, contextName, userId, trigger }: ProductSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [newInventory, setNewInventory] = useState(10);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'stand') {
        const result = await getStandProducts(contextId);
        if (result.success && result.products) {
          setProducts(result.products);
        }
      } else {
        const result = await getDeliveryZoneProducts(contextId);
        if (result.success && result.products) {
          setProducts(result.products);
        }
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, [mode, contextId]);

  const loadAvailableProducts = useCallback(async () => {
    setPickerLoading(true);
    try {
      const result = await getAvailableProducts(userId, contextId, mode);
      if (result.success && result.products) {
        setAvailableProducts(result.products);
      }
    } catch (error) {
      console.error("Error loading available products:", error);
    } finally {
      setPickerLoading(false);
    }
  }, [userId, contextId, mode]);

  useEffect(() => {
    if (isOpen && !showPicker) {
      loadProducts();
    }
  }, [isOpen, loadProducts, showPicker]);

  useEffect(() => {
    if (showPicker) {
      loadAvailableProducts();
    }
  }, [showPicker, loadAvailableProducts]);

  const handleInventoryChange = async (product: ProductData, newValue: number) => {
    if (newValue < 0) return;

    // Optimistic update
    setProducts(prev =>
      prev.map(p => p.productId === product.productId ? { ...p, inventory: newValue } : p)
    );

    try {
      if (mode === 'stand' && product.listingId) {
        await updateStandProductInventory(product.listingId, newValue);
      } else {
        await updateDeliveryProductInventory(product.productId, contextId, newValue);
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
      // Revert on error
      loadProducts();
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) return;

    try {
      if (mode === 'stand') {
        const result = await addProductToStand(selectedProduct, contextId, newInventory);
        if (result.success) {
          setShowPicker(false);
          setSelectedProduct(null);
          setNewInventory(10);
          await loadProducts();
        } else {
          alert(result.error || "Error adding product");
        }
      } else {
        const result = await addProductToDeliveryZone(selectedProduct, contextId, newInventory);
        if (result.success) {
          setShowPicker(false);
          setSelectedProduct(null);
          setNewInventory(10);
          await loadProducts();
        } else {
          alert(result.error || "Error adding product");
        }
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col min-w-0">
        <SheetHeader className="border-b pb-3">
          <SheetTitle>{contextName} Products</SheetTitle>
        </SheetHeader>

        {showPicker ? (
          <>
            {/* Product picker view */}
            <div className="flex items-center justify-between py-2 border-b">
              <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>
                ← Back
              </Button>
              <h3 className="text-sm font-semibold">Add Product</h3>
              <div className="w-16" />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {pickerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500 text-sm">No products available to add</p>
                  <Link href="/onboarding/producer">
                    <Button variant="link" className="text-sm mt-2">
                      Create a new product →
                    </Button>
                  </Link>
                </div>
              ) : (
                availableProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProduct === product.id}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product.id);
                      }}
                      className="h-4 w-4 rounded"
                    />
                    {product.images[0] && (
                      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-600">
                        ${(product.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedProduct && (
              <div className="border-t pt-3 px-4 pb-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Initial Inventory</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewInventory(Math.max(0, newInventory - 1))}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <input
                      type="number"
                      value={newInventory}
                      onChange={(e) => setNewInventory(Math.max(0, parseInt(e.target.value) || 0))}
                      onFocus={(e) => e.target.select()}
                      className="w-16 text-center text-sm border rounded px-2 py-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewInventory(newInventory + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Add Product
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Product list view */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500 text-sm">No products yet</p>
                </div>
              ) : (
                products.map((product) => (
                  <ProductInventoryRow
                    key={product.productId}
                    product={product}
                    onInventoryChange={handleInventoryChange}
                  />
                ))
              )}
            </div>

            <div className="border-t pt-3 px-4 pb-4 space-y-2">
              <Button
                onClick={() => setShowPicker(true)}
                variant="outline"
                className="w-full"
              >
                + Add existing product
              </Button>
              <Link href="/onboarding/producer">
                <Button variant="ghost" className="w-full text-gray-500">
                  + Create new product
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface ProductInventoryRowProps {
  product: ProductData;
  onInventoryChange: (product: ProductData, newValue: number) => void;
}

function ProductInventoryRow({ product, onInventoryChange }: ProductInventoryRowProps) {
  const [inventory, setInventory] = useState(product.inventory);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInventory(product.inventory);
  }, [product.inventory]);

  const handleInventoryUpdate = (newValue: number) => {
    if (newValue < 0) return;
    setInventory(newValue);

    // Debounce the update
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      onInventoryChange(product, newValue);
    }, 500);
    setDebounceTimer(timer);
  };

  return (
    <div className="flex items-center gap-3 py-3 px-4 min-w-0">
      {product.images[0] && (
        <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm truncate">{product.name}</h4>
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
              Edit →
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-600">
          ${(product.price / 100).toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          Sold: {product.sold} · Restocked {product.timeAgo}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInventoryUpdate(inventory - 1)}
            className="w-8 h-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <input
            type="number"
            value={inventory}
            onChange={(e) => handleInventoryUpdate(parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="w-12 text-center text-sm border rounded px-1 py-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInventoryUpdate(inventory + 1)}
            className="w-8 h-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
