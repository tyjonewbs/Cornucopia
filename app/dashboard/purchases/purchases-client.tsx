"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  MapPin,
  Store,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/cart/calculations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Purchase } from "@/app/actions/orders";
import type { OrderStatus } from "@prisma/client";

type StatusFilter = "all" | "active" | "completed" | "cancelled";

interface PurchasesClientProps {
  purchases: Purchase[];
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function filterPurchases(purchases: Purchase[], filter: StatusFilter): Purchase[] {
  switch (filter) {
    case "active":
      return purchases.filter(p =>
        ["PENDING", "CONFIRMED", "READY"].includes(p.status)
      );
    case "completed":
      return purchases.filter(p =>
        ["DELIVERED", "COMPLETED"].includes(p.status)
      );
    case "cancelled":
      return purchases.filter(p => p.status === "CANCELLED");
    default:
      return purchases;
  }
}

function getStatusBadgeVariant(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "secondary" as const;
    case "CONFIRMED":
      return "default" as const;
    case "READY":
      return "outline" as const;
    case "DELIVERED":
      return "default" as const;
    case "COMPLETED":
      return "secondary" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function getStatusLabel(status: OrderStatus, type: string) {
  switch (status) {
    case "PENDING":
      return "Order Placed";
    case "CONFIRMED":
      return "Confirmed";
    case "READY":
      return type === "PICKUP" ? "Ready for Pickup" : "Out for Delivery";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export default function PurchasesClient({ purchases }: PurchasesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = filterPurchases(purchases, filter);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Purchases refreshed");
    }, 500);
  };

  return (
    <div className="flex-1">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Purchases</h1>
            <p className="text-gray-600 mt-1">
              Track and manage your orders
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ key, label }) => {
            const count =
              key === "all"
                ? purchases.length
                : filterPurchases(purchases, key).length;
            return (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key)}
                className={filter === key ? "bg-[#8B4513] hover:bg-[#8B4513]/90" : ""}
              >
                {label}
                {count > 0 && (
                  <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Purchases List */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((purchase) => (
              <Link key={purchase.id} href={`/dashboard/purchases/${purchase.id}`}>
                <Card className="overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900 font-mono text-sm">
                            #{purchase.orderNumber}
                          </span>
                          <Badge variant={getStatusBadgeVariant(purchase.status)}>
                            {getStatusLabel(purchase.status, purchase.type)}
                          </Badge>
                          {purchase.hasActiveIssue && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Issue Reported
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Store className="h-3.5 w-3.5" />
                          <span>{purchase.marketStandName}</span>
                          <span className="text-gray-400 mx-0.5">·</span>
                          <Package className="h-3.5 w-3.5" />
                          <span>{purchase.items.length} {purchase.items.length === 1 ? 'item' : 'items'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          {purchase.type === "DELIVERY" ? (
                            <>
                              <Truck className="h-3 w-3" />
                              <span>Delivery</span>
                              {purchase.deliveryDate && (
                                <span>· {new Date(purchase.deliveryDate).toLocaleDateString()}</span>
                              )}
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>Pickup</span>
                              {purchase.pickupTime && (
                                <span>· {new Date(purchase.pickupTime).toLocaleString()}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#8B4513]">
                            {formatPrice(purchase.totalAmount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "all" ? "No Purchases Yet" : `No ${STATUS_FILTERS.find(f => f.key === filter)?.label} Purchases`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === "all"
                  ? "Your order history will appear here once you make a purchase"
                  : "No purchases match this filter"}
              </p>
              {filter === "all" && (
                <Button asChild className="bg-[#8B4513] hover:bg-[#8B4513]/90">
                  <Link href="/market-stand/grid">Start Shopping</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
