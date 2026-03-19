"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Plus, Search, MapPin, Truck, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductWithListingsDTO } from "@/lib/dto/product.dto";
import { DeliveryZoneInfo } from "@/types/delivery";
import { formatPrice } from "@/lib/utils/format";

interface ProductsClientProps {
  initialProducts: ProductWithListingsDTO[];
  deliveryZones: DeliveryZoneInfo[];
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
  marketStands,
}: ProductsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search
  const filteredProducts = initialProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get total inventory across all locations
  const getTotalInventory = (product: ProductWithListingsDTO): number => {
    const standInventory = product.standListings.reduce(
      (sum, listing) => sum + (listing.customInventory || 0), 
      0
    );
    const deliveryInventory = product.deliveryListings.reduce(
      (sum, listing) => sum + listing.inventory, 
      0
    );
    return standInventory + deliveryInventory;
  };

  // Helper function to get all availability locations
  const getAvailabilityLocations = (product: ProductWithListingsDTO) => {
    const locations: Array<{ type: 'stand' | 'delivery'; name: string; inventory: number }> = [];
    
    // Add market stands
    product.standListings.forEach(listing => {
      if (listing.marketStand) {
        locations.push({
          type: 'stand',
          name: listing.marketStand.name,
          inventory: listing.customInventory || 0
        });
      }
    });
    
    // Add delivery zones
    product.deliveryListings.forEach(listing => {
      if (listing.deliveryZone) {
        locations.push({
          type: 'delivery',
          name: `${listing.dayOfWeek} - ${listing.deliveryZone.name}`,
          inventory: listing.inventory
        });
      }
    });
    
    return locations;
  };

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          <Button asChild>
            <Link href="/product/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Table */}
        {filteredProducts.length > 0 ? (
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base font-medium">All Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredProducts.map((product) => {
                  const locations = getAvailabilityLocations(product);
                  const totalInventory = getTotalInventory(product);

                  return (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        {/* Product Image & Info */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                          {/* Image */}
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                            {product.images[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover rounded-lg"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Name & Price */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <p className="text-base sm:text-lg font-bold text-[#8B4513]">
                              {formatPrice(product.price)}
                            </p>
                          </div>

                          {/* Edit Button - inline on mobile */}
                          <div className="flex-shrink-0 sm:hidden">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                            >
                              <Link href={`/product/${product.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Available At */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="text-sm text-gray-500 mb-1 sm:mb-2">Available at:</div>
                          {locations.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {locations.map((location, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm"
                                >
                                  {location.type === 'stand' ? (
                                    <MapPin className="h-3 w-3 text-gray-600 flex-shrink-0" />
                                  ) : (
                                    <Truck className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                  )}
                                  <span className="text-gray-700 truncate max-w-[150px] sm:max-w-none">
                                    {location.name}
                                  </span>
                                  <span className="text-gray-500">
                                    ({location.inventory})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-amber-600 italic">
                              No fulfillment options set
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1 sm:mt-2">
                            Total inventory: {totalInventory}
                          </div>
                        </div>

                        {/* Edit Button - desktop only */}
                        <div className="flex-shrink-0 hidden sm:block">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                          >
                            <Link href={`/product/${product.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              {searchTerm ? (
                <>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search term
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
