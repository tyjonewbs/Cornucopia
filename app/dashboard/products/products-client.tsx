"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Calendar,
  Truck,
  MapPin,
  Edit,
  Minus,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductWithListingsDTO, ProductDeliveryListingDTO } from "@/lib/dto/product.dto";
import { DeliveryZone } from "@/types/delivery";
import { getProductsWithListings, updateDeliveryListingInventory } from "@/app/actions/products";
import { createProductListing, updateListingInventory, removeProductListing } from "@/app/actions/product-listings";
import { formatPrice } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductsClientProps {
  initialProducts: ProductWithListingsDTO[];
  deliveryZones: DeliveryZone[];
  userId: string;
  marketStands: Array<{
    id: string;
    name: string;
  }>;
  orderCounts: Record<string, Record<string, number>>;
}

export default function ProductsClient({ 
  initialProducts, 
  deliveryZones,
  userId,
  marketStands,
  orderCounts
}: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [inventoryChanges, setInventoryChanges] = useState<Record<string, number>>({});
  const [deliveryInventoryChanges, setDeliveryInventoryChanges] = useState<Record<string, number>>({});
  const [selectedStandForDialog, setSelectedStandForDialog] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshedProducts = await getProductsWithListings();
      setProducts(refreshedProducts);
      toast.success("Products refreshed successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to refresh products:", error);
      toast.error("Failed to refresh products");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInventoryChange = (listingId: string, delta: number) => {
    const listing = products
      .flatMap(p => p.standListings)
      .find(l => l.id === listingId);
    
    if (!listing) return;
    
    const currentInventory = inventoryChanges[listingId] ?? (listing.customInventory || 0);
    const newInventory = Math.max(0, currentInventory + delta);
    
    setInventoryChanges(prev => ({
      ...prev,
      [listingId]: newInventory
    }));
  };

  const handleInventoryInput = (listingId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    
    setInventoryChanges(prev => ({
      ...prev,
      [listingId]: Math.max(0, numValue)
    }));
  };

  const handleUpdateInventory = async (listingId: string) => {
    const newInventory = inventoryChanges[listingId];
    
    if (newInventory === undefined) return;

    startTransition(async () => {
      try {
        await updateListingInventory(listingId, newInventory);
        
        // Refresh products
        const refreshedProducts = await getProductsWithListings();
        setProducts(refreshedProducts);
        
        // Clear the change
        setInventoryChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[listingId];
          return newChanges;
        });
        
        toast.success("Inventory updated successfully");
        router.refresh();
      } catch (error) {
        console.error("Failed to update inventory:", error);
        toast.error("Failed to update inventory");
      }
    });
  };

  const handleAssignProductToStand = async (productId: string, standId: string) => {
    startTransition(async () => {
      try {
        await createProductListing(productId, standId, 0);
        
        const refreshedProducts = await getProductsWithListings();
        setProducts(refreshedProducts);
        setSelectedStandForDialog(null);
        
        toast.success("Product assigned to market stand");
        router.refresh();
      } catch (error) {
        console.error("Failed to assign product:", error);
        toast.error("Failed to assign product");
      }
    });
  };

  const handleRemoveProductFromStand = async (listingId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from this stand?`)) return;
    
    startTransition(async () => {
      try {
        await removeProductListing(listingId);
        
        const refreshedProducts = await getProductsWithListings();
        setProducts(refreshedProducts);
        
        toast.success("Product removed from stand");
        router.refresh();
      } catch (error) {
        console.error("Failed to remove product:", error);
        toast.error("Failed to remove product");
      }
    });
  };

  const handleDeliveryInventoryChange = (listingId: string, delta: number) => {
    const listing = products
      .flatMap(p => p.deliveryListings)
      .find(l => l.id === listingId);
    
    if (!listing) return;
    
    const currentInventory = deliveryInventoryChanges[listingId] ?? listing.inventory;
    const newInventory = Math.max(0, currentInventory + delta);
    
    setDeliveryInventoryChanges(prev => ({
      ...prev,
      [listingId]: newInventory
    }));
  };

  const handleDeliveryInventoryInput = (listingId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    
    setDeliveryInventoryChanges(prev => ({
      ...prev,
      [listingId]: Math.max(0, numValue)
    }));
  };

  const handleUpdateDeliveryInventory = async (listingId: string) => {
    const newInventory = deliveryInventoryChanges[listingId];
    
    if (newInventory === undefined) return;

    startTransition(async () => {
      try {
        await updateDeliveryListingInventory(listingId, newInventory);
        
        const refreshedProducts = await getProductsWithListings();
        setProducts(refreshedProducts);
        
        setDeliveryInventoryChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[listingId];
          return newChanges;
        });
        
        toast.success("Delivery inventory updated");
        router.refresh();
      } catch (error) {
        console.error("Failed to update delivery inventory:", error);
        toast.error("Failed to update delivery inventory");
      }
    });
  };

  // Get products without ANY fulfillment (no listings and no delivery)
  const productsWithoutFulfillment = products.filter(
    p => p.standListings.length === 0 && !p.deliveryAvailable
  );

  // Group products by market stand
  const productsByStand = marketStands.map(stand => ({
    stand,
    listings: products.flatMap(product => 
      product.standListings
        .filter(listing => listing.marketStandId === stand.id)
        .map(listing => ({
          product,
          listing,
          inventory: listing.customInventory || 0
        }))
    )
  }));

  // Group delivery zones by delivery days
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const deliveryByDay = DAYS.map(day => {
    // Find zones that deliver on this day
    const zonesForDay = deliveryZones.filter(zone => 
      zone.isActive && zone.deliveryDays.includes(day)
    );
    
    // Get all delivery listings for this day
    const listingsForDay = products.flatMap(product =>
      product.deliveryListings
        .filter(listing => listing.dayOfWeek === day)
        .map(listing => ({ product, listing }))
    );
    
    // Calculate total orders for this day across all zones
    const orderCount = zonesForDay.reduce((total, zone) => {
      return total + (orderCounts[day]?.[zone.id] || 0);
    }, 0);
    
    return {
      day,
      zones: zonesForDay,
      listings: listingsForDay,
      orderCount
    };
  }).filter(d => d.zones.length > 0); // Only show days that have zones

  // Products available to add to a stand (all products)
  const getAvailableProductsForStand = (standId: string) => {
    return products.filter(p => {
      // Don't show if already at this stand
      const alreadyAtStand = p.standListings.some(l => l.marketStandId === standId);
      return !alreadyAtStand;
    });
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600 mt-1">
              Manage inventory across all your market stands - products can be listed at multiple locations
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
              <Link href="/product/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Products Without Fulfillment Section */}
        {productsWithoutFulfillment.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="bg-amber-100">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Package className="h-5 w-5" />
                Products Without Fulfillment
                <span className="text-sm font-normal text-amber-700 ml-auto">
                  Action Required - {productsWithoutFulfillment.length} {productsWithoutFulfillment.length === 1 ? 'product' : 'products'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-amber-200">
                {productsWithoutFulfillment.map((product) => (
                  <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-amber-100/50">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0">
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="80px"
                        />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-[#8B4513]">{formatPrice(product.price)}</p>
                      <p className="text-sm text-amber-700 font-medium mt-1">
                        ⚠️ No fulfillment option set - customers can't purchase this yet
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link href={`/product/${product.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Product
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Stand Sections */}
        {productsByStand.map(({ stand, listings }) => {
          const availableProducts = getAvailableProductsForStand(stand.id);
          
          return (
            <Card key={stand.id}>
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#8B4513]" />
                    {stand.name}
                    <span className="text-sm font-normal text-gray-500">
                      {listings.length} {listings.length === 1 ? 'product' : 'products'}
                    </span>
                  </CardTitle>
                  <Dialog 
                    open={selectedStandForDialog === stand.id} 
                    onOpenChange={(open) => setSelectedStandForDialog(open ? stand.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Product to {stand.name}</DialogTitle>
                        <DialogDescription>
                          Select a product to list at this market stand
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 mt-4">
                        {availableProducts.length > 0 ? (
                          availableProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => handleAssignProductToStand(product.id, stand.id)}
                            >
                              <div className="relative w-16 h-16 flex-shrink-0">
                                {product.images[0] && (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover rounded"
                                    sizes="64px"
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{product.name}</h4>
                                <p className="text-sm text-[#8B4513] font-bold">{formatPrice(product.price)}</p>
                                {product.standListings.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Currently at: {product.standListings.map(l => l.marketStand?.name).join(', ')}
                                  </p>
                                )}
                              </div>
                              <Plus className="h-5 w-5 text-gray-400" />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>All products are already listed at this stand</p>
                            <Button asChild className="mt-4" size="sm">
                              <Link href="/product/new">
                                Create New Product
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {listings.length > 0 ? (
                  <div className="divide-y">
                    {listings.map(({ product, listing, inventory }) => {
                      const currentInventory = inventoryChanges[listing.id] ?? inventory;
                      const hasChanges = inventoryChanges[listing.id] !== undefined;
                      
                      return (
                        <div key={listing.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                          {/* Product Image */}
                          <div className="relative w-20 h-20 flex-shrink-0">
                            {product.images[0] && (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover rounded-lg"
                                sizes="80px"
                              />
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                            <p className="text-lg font-bold text-[#8B4513]">{formatPrice(product.price)}</p>
                            {product.standListings.length > 1 && (
                              <p className="text-xs text-blue-600 mt-1">
                                Also at {product.standListings.length - 1} other {product.standListings.length - 1 === 1 ? 'stand' : 'stands'}
                              </p>
                            )}
                          </div>
                          
                          {/* Inventory Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInventoryChange(listing.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={currentInventory}
                              onChange={(e) => handleInventoryInput(listing.id, e.target.value)}
                              className="h-8 w-20 text-center"
                              min="0"
                            />
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInventoryChange(listing.id, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleUpdateInventory(listing.id)}
                              disabled={!hasChanges || isPending}
                              size="sm"
                              className="ml-2"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Update
                            </Button>
                            
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                            >
                              <Link href={`/product/${product.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProductFromStand(listing.id, product.name)}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p className="mb-2">No products at this stand yet</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedStandForDialog(stand.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Delivery Days Section */}
        {deliveryByDay.map(({ day, zones, listings, orderCount }) => (
          <Card key={day}>
            <CardHeader className="bg-blue-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {day} Deliveries
                  <span className="text-sm font-normal text-gray-500">
                    {listings.length} {listings.length === 1 ? 'product' : 'products'} • 
                    <Link 
                      href="/dashboard/orders" 
                      className="text-blue-600 hover:text-blue-700 hover:underline ml-1"
                    >
                      {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                    </Link>
                  </span>
                </CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/delivery-zones">
                    <MapPin className="h-4 w-4 mr-1" />
                    Manage Zones
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Delivery Zones Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Delivery Zones:</span>
                <div className="flex gap-2">
                  {zones.map((zone) => (
                    <span key={zone.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {zone.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Products List */}
              {listings.length > 0 ? (
                <div className="divide-y border rounded-lg">
                  {listings.map(({ product, listing }) => {
                    const currentInventory = deliveryInventoryChanges[listing.id] ?? listing.inventory;
                    const hasChanges = deliveryInventoryChanges[listing.id] !== undefined;
                    
                    return (
                      <div key={listing.id} className="p-3 flex items-center gap-4 hover:bg-gray-50">
                        {/* Product Image */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover rounded-lg"
                              sizes="64px"
                            />
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                          <p className="text-sm font-bold text-[#8B4513]">{formatPrice(product.price)}</p>
                          {listing.deliveryZone && (
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {listing.deliveryZone.name}
                            </p>
                          )}
                        </div>

                        {/* Order Count Badge */}
                        {listing.deliveryZone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mr-2">
                            <span className="font-medium">{orderCounts[day]?.[listing.deliveryZone.id] || 0} orders</span>
                          </div>
                        )}

                        {/* Inventory Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliveryInventoryChange(listing.id, -1)}
                            className="h-8 w-8 p-0"
                            disabled={currentInventory === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={currentInventory}
                            onChange={(e) => handleDeliveryInventoryInput(listing.id, e.target.value)}
                            className="h-8 w-20 text-center"
                            min="0"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliveryInventoryChange(listing.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            onClick={() => handleUpdateDeliveryInventory(listing.id)}
                            disabled={!hasChanges || isPending}
                            size="sm"
                            className="ml-2"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                          >
                            <Link href={`/product/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                  <p>No products scheduled for {day} delivery</p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/product/new">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Product
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {products.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by adding your first product
              </p>
              <Button asChild>
                <Link href="/product/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
