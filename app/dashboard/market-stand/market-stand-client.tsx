"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Edit,
  MapPin,
  Package,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { updateStandProductInventory } from "@/app/actions/product-listings";
import { ProductInventoryRow } from "@/components/dashboard/ProductInventoryRow";

interface StandListing {
  id: string;
  productId: string;
  customInventory: number | null;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  locationName: string;
  locationGuide: string;
  latitude: number;
  longitude: number;
  images: string[];
  tags: string[];
  standListings: StandListing[];
  _count: {
    standListings: number;
  };
}

interface ProductInfo {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface MarketStandDashboardClientProps {
  initialMarketStands: MarketStand[];
  allProducts: ProductInfo[];
}

export function MarketStandDashboardClient({
  initialMarketStands,
  allProducts,
}: MarketStandDashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedStands, setExpandedStands] = useState<Set<string>>(
    // Auto-expand first stand
    new Set(initialMarketStands[0] ? [initialMarketStands[0].id] : [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Inventory refreshed");
    }, 500);
  };

  const toggleStand = (standId: string) => {
    setExpandedStands((prev) => {
      const next = new Set(prev);
      if (next.has(standId)) {
        next.delete(standId);
      } else {
        next.add(standId);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Market Stand Inventory
            </h1>
            <p className="text-gray-600 mt-1">
              Manage product availability and inventory for each market stand
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/product/new">
                <Plus className="h-4 w-4 mr-2" />
                New Product
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/market-stand/setup/new">
                <Plus className="h-4 w-4 mr-2" />
                New Market Stand
              </Link>
            </Button>
          </div>
        </div>

        {/* Market Stands */}
        {initialMarketStands.map((stand) => {
          const isExpanded = expandedStands.has(stand.id);
          const activeListings = stand.standListings.filter(
            (l) => (l.customInventory ?? 0) > 0
          );
          const totalInventory = activeListings.reduce(
            (sum, l) => sum + (l.customInventory ?? 0),
            0
          );

          // Build a lookup of listings by product ID
          const listingByProductId = new Map(
            stand.standListings.map((l) => [l.productId, l])
          );

          return (
            <Card key={stand.id} className="overflow-hidden">
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleStand(stand.id)}
              >
                {/* Stand Header */}
                <CardHeader className="bg-amber-50">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start hover:bg-amber-100"
                      >
                        <MapPin className="h-5 w-5 mr-2 text-amber-700" />
                        <span className="font-semibold text-lg">
                          {stand.name}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 ml-2 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/market-stand/setup/edit/${stand.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Stand Summary */}
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2 ml-7">
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="font-semibold ml-2">
                        {stand.locationName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Active Products:</span>
                      <span className="font-semibold ml-2">
                        {activeListings.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Inventory:</span>
                      <span className="font-semibold ml-2">
                        {totalInventory}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {/* Collapsible Products */}
                <CollapsibleContent>
                  <CardContent className="p-4">
                    {allProducts.length > 0 ? (
                      <div className="space-y-2">
                        {allProducts.map((product) => {
                          const listing = listingByProductId.get(product.id);
                          return (
                            <ProductInventoryRow
                              key={product.id}
                              product={product}
                              initialInventory={listing?.customInventory ?? 0}
                              lastRestocked={listing?.updatedAt}
                              onInventoryChange={async (_productId, newValue) =>
                                updateStandProductInventory(product.id, stand.id, newValue)
                              }
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="mb-3">No products yet</p>
                        <Button asChild size="sm">
                          <Link href="/product/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Product
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {/* Empty State - No Stands */}
        {initialMarketStands.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No market stands yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first market stand to start selling products
              </p>
              <Button asChild>
                <Link href="/dashboard/market-stand/setup/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Market Stand
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
