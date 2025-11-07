"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar,
  Truck,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Minus,
  RefreshCw,
  PackagePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  deleteDeliveryZone,
  addProductToDeliveryZone,
  updateDeliveryListingInventory,
  removeProductFromDeliveryZone,
  getAvailableProductsForZone,
} from "@/app/actions/delivery-zones";
import { formatPrice } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductListing {
  id: string;
  productId: string;
  deliveryZoneId: string;
  dayOfWeek: string;
  inventory: number;
  reserved: number;
  remaining: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    isActive: boolean;
  };
}

interface ZoneWithProducts {
  zone: any;
  productsByDay: Record<string, ProductListing[]>;
}

interface DeliveryClientProps {
  zonesWithProducts: ZoneWithProducts[];
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

export default function DeliveryClient({ zonesWithProducts }: DeliveryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [addingToZone, setAddingToZone] = useState<{ zoneId: string; day: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [initialInventory, setInitialInventory] = useState("10");

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Inventory refreshed");
    }, 500);
  };

  const handleDeleteZone = async (zoneId: string, zoneName: string) => {
    if (!confirm(`Are you sure you want to delete "${zoneName}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteDeliveryZone(zoneId);
        if (result.success) {
          toast.success("Delivery zone deleted successfully");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to delete zone");
        }
      } catch (error) {
        console.error("Failed to delete zone:", error);
        toast.error("Failed to delete zone");
      }
    });
  };

  const toggleDay = (day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleOpenAddProducts = async (zoneId: string, day: string) => {
    setAddingToZone({ zoneId, day });
    setLoadingProducts(true);
    
    const result = await getAvailableProductsForZone(zoneId, day);
    if (result.success) {
      setAvailableProducts(result.products || []);
    } else {
      toast.error("Failed to load available products");
    }
    setLoadingProducts(false);
  };

  const handleCloseAddProducts = () => {
    setAddingToZone(null);
    setSelectedProduct(null);
    setIsRecurring(false);
    setInitialInventory("10");
    setAvailableProducts([]);
  };

  const handleAddProduct = async (productId: string) => {
    if (!addingToZone) return;

    const inventory = parseInt(initialInventory);
    if (isNaN(inventory) || inventory < 0) {
      toast.error("Please enter a valid inventory amount");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addProductToDeliveryZone({
          productId,
          deliveryZoneId: addingToZone.zoneId,
          dayOfWeek: addingToZone.day,
          isRecurring,
          initialInventory: inventory,
        });

        if (result.success) {
          toast.success(result.message || "Product added successfully");
          handleCloseAddProducts();
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add product");
        }
      } catch (error) {
        console.error("Failed to add product:", error);
        toast.error("Failed to add product");
      }
    });
  };

  const handleUpdateInventory = async (listingId: string, newValue: number) => {
    if (newValue < 0) return;

    startTransition(async () => {
      try {
        const result = await updateDeliveryListingInventory(listingId, newValue);
        if (result.success) {
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update inventory");
        }
      } catch (error) {
        console.error("Failed to update inventory:", error);
        toast.error("Failed to update inventory");
      }
    });
  };

  const handleRemoveProduct = async (listingId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from this delivery day?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await removeProductFromDeliveryZone(listingId);
        if (result.success) {
          toast.success("Product removed successfully");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to remove product");
        }
      } catch (error) {
        console.error("Failed to remove product:", error);
        toast.error("Failed to remove product");
      }
    });
  };

  // Check if a product is recurring (appears on multiple days in the same zone)
  const isProductRecurring = (zoneWithProducts: ZoneWithProducts, productId: string): boolean => {
    let daysCount = 0;
    Object.values(zoneWithProducts.productsByDay).forEach(listings => {
      if (listings.some(l => l.productId === productId)) {
        daysCount++;
      }
    });
    return daysCount > 1;
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Zone Inventory</h1>
            <p className="text-gray-600 mt-1">
              Manage product availability and inventory for each delivery zone
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/delivery-zones/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Zone
              </Link>
            </Button>
          </div>
        </div>

        {/* Days with Zones */}
        {DAYS.map(day => {
          const dayZones = zonesWithProducts.filter(
            zwp => zwp.zone.isActive && zwp.zone.deliveryDays.includes(day)
          );
          
          if (dayZones.length === 0) return null;

          return (
            <Card key={day} className="overflow-hidden">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {day} Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {dayZones.map(({ zone, productsByDay }) => {
                  const dayProducts = productsByDay[day] || [];
                  const totalInventory = dayProducts.reduce((sum, p) => sum + p.inventory, 0);
                  const isExpanded = expandedDays.has(`${zone.id}-${day}`);

                  return (
                    <Collapsible
                      key={`${zone.id}-${day}`}
                      open={isExpanded}
                      onOpenChange={() => toggleDay(`${zone.id}-${day}`)}
                    >
                      <div className="border rounded-lg">
                        {/* Zone Header */}
                        <div className="p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="flex-1 justify-start hover:bg-gray-100">
                                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="font-semibold">{zone.name}</span>
                                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/delivery-zones/${zone.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteZone(zone.id, zone.name)}
                                disabled={isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Zone Summary */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Products:</span>
                              <span className="font-semibold ml-2">{dayProducts.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Inventory:</span>
                              <span className="font-semibold ml-2">{totalInventory}</span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Products */}
                        <CollapsibleContent>
                          <div className="p-4 border-t bg-white space-y-3">
                            {/* Product List */}
                            {dayProducts.map(listing => {
                              const isSoldOut = listing.remaining === 0;
                              const recurring = isProductRecurring({ zone, productsByDay }, listing.productId);
                              
                              return (
                                <div 
                                  key={listing.id} 
                                  className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    {/* Product Image */}
                                    {listing.product.images && listing.product.images.length > 0 && (
                                      <div className="relative w-16 h-16 flex-shrink-0">
                                        <Image
                                          src={listing.product.images[0]}
                                          alt={listing.product.name}
                                          fill
                                          className="object-cover rounded"
                                          sizes="64px"
                                        />
                                      </div>
                                    )}

                                    {/* Product Info & Controls */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">
                                              {listing.product.name}
                                            </h4>
                                            {recurring && (
                                              <Badge variant="secondary" className="text-xs">
                                                Recurring
                                              </Badge>
                                            )}
                                            {isSoldOut && (
                                              <Badge variant="destructive" className="text-xs">
                                                SOLD OUT
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600">
                                            {formatPrice(listing.product.price)}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Inventory Stats */}
                                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                        <div>
                                          <span className="text-gray-600">Available:</span>
                                          <span className="font-semibold ml-1">{listing.inventory}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Reserved:</span>
                                          <span className="font-semibold ml-1">{listing.reserved}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Remaining:</span>
                                          <span className="font-semibold ml-1">{listing.remaining}</span>
                                        </div>
                                      </div>

                                      {/* Inventory Controls */}
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUpdateInventory(listing.id, listing.inventory - 1)}
                                            disabled={isPending || listing.inventory <= 0}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <Input
                                            type="number"
                                            value={listing.inventory}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value);
                                              if (!isNaN(val)) {
                                                handleUpdateInventory(listing.id, val);
                                              }
                                            }}
                                            className="w-20 text-center"
                                            min="0"
                                            disabled={isPending}
                                          />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUpdateInventory(listing.id, listing.inventory + 1)}
                                            disabled={isPending}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRemoveProduct(listing.id, listing.product.name)}
                                          disabled={isPending}
                                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add Products Button */}
                            <Button
                              variant="outline"
                              className="w-full border-dashed"
                              onClick={() => handleOpenAddProducts(zone.id, day)}
                              disabled={isPending}
                            >
                              <PackagePlus className="h-4 w-4 mr-2" />
                              Add Products to {day} Delivery
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {zonesWithProducts.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No delivery zones yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first delivery zone to start managing inventory
              </p>
              <Button asChild>
                <Link href="/dashboard/delivery-zones/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Zone
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Products Dialog */}
      <Dialog open={addingToZone !== null} onOpenChange={(open) => !open && handleCloseAddProducts()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Products to Delivery Zone</DialogTitle>
            <DialogDescription>
              Select products to add to this delivery day. Use recurring to add to all delivery days in this zone.
            </DialogDescription>
          </DialogHeader>

          {loadingProducts ? (
            <div className="py-8 text-center text-gray-500">Loading available products...</div>
          ) : availableProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No more products available to add
            </div>
          ) : (
            <div className="space-y-3">
              {availableProducts.map(product => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {product.images && product.images.length > 0 && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-600">{formatPrice(product.price)}</p>
                      
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`recurring-${product.id}`}
                              checked={selectedProduct === product.id && isRecurring}
                              onCheckedChange={(checked) => {
                                setSelectedProduct(product.id);
                                setIsRecurring(checked as boolean);
                              }}
                            />
                            <Label htmlFor={`recurring-${product.id}`} className="text-sm">
                              Add as recurring (all delivery days)
                            </Label>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label htmlFor={`inventory-${product.id}`} className="text-sm">
                              Initial Inventory
                            </Label>
                            <Input
                              id={`inventory-${product.id}`}
                              type="number"
                              min="0"
                              value={selectedProduct === product.id ? initialInventory : "10"}
                              onChange={(e) => {
                                setSelectedProduct(product.id);
                                setInitialInventory(e.target.value);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            onClick={() => handleAddProduct(product.id)}
                            disabled={isPending}
                            className="mt-6"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
