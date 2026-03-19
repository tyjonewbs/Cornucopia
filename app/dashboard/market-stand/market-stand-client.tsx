"use client";

import { useState, useTransition } from "react";
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
import { toggleStandOpen } from "@/app/actions/stand-portal";

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
  isOpen: boolean;
  hours: Record<string, any> | null;
  lastCheckedIn: Date | null;
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

// Helper to format time from 24h to 12h
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

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

// Inline toggle component
function StandToggle({ stand }: { stand: MarketStand }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(stand.isOpen);

  const todayHours = getTodayHours(stand.hours);

  const handleToggle = async () => {
    startTransition(async () => {
      // Optimistic update
      setIsOpen(!isOpen);

      const result = await toggleStandOpen(stand.id);

      if (result.error) {
        // Revert on error
        setIsOpen(isOpen);
        toast.error(result.error);
      } else {
        toast.success(isOpen ? "Stand closed" : "Stand opened");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {isOpen ? (
        <>
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
            Open
          </span>
          <Button
            onClick={handleToggle}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isPending ? "..." : "Close"}
          </Button>
        </>
      ) : (
        <>
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
            Closed
          </span>
          <Button
            onClick={handleToggle}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {isPending ? "..." : "Open"}
          </Button>
        </>
      )}
    </div>
  );
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
    <div className="flex-1">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
              <Link href="/onboarding/producer">
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
          const totalInventory = stand.standListings.reduce(
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
                  <div className="flex items-center justify-between gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start hover:bg-amber-100 min-w-0"
                      >
                        <MapPin className="h-5 w-5 mr-2 text-amber-700 flex-shrink-0" />
                        <span className="font-semibold text-lg truncate max-w-[200px]">
                          {stand.name}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <StandToggle stand={stand} />
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/market-stand/setup/edit/${stand.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Stand Summary */}
                  <div className="flex flex-col gap-1 sm:grid sm:grid-cols-2 text-sm mt-2 ml-7">
                    <div>
                      <span className="text-gray-600">Products:</span>
                      <span className="font-semibold ml-2">
                        {activeListings.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Inventory:</span>
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
                          <Link href="/onboarding/producer">
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
