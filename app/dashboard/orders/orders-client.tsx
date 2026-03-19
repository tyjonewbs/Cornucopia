"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Truck,
  MapPin,
  User,
  Package,
  Check,
  RefreshCw,
  Store,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type SellerOrders,
  type DeliveryOrder,
  updateOrderStatus,
} from "@/app/actions/orders";
import { formatPrice } from "@/lib/cart/calculations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";

interface OrdersClientProps {
  sellerOrders: SellerOrders;
}

export default function OrdersClient({ sellerOrders }: OrdersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { deliveryOrdersByDay, pickupOrdersByStand } = sellerOrders;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysWithOrders = DAYS.filter(day => deliveryOrdersByDay[day]?.length > 0);

  const totalDeliveryOrders = daysWithOrders.reduce((sum, day) => {
    return sum + (deliveryOrdersByDay[day]?.reduce((s, z) => s + z.orders.length, 0) || 0);
  }, 0);
  const totalPickupOrders = pickupOrdersByStand.reduce(
    (sum, stand) => sum + stand.orders.length, 0
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Orders refreshed");
    }, 500);
  };

  const handleStatusUpdate = async (orderId: string, orderNumber: string, status: OrderStatus, label: string) => {
    if (status === 'DELIVERED' || status === 'COMPLETED') {
      if (!confirm(`Mark order ${orderNumber} as ${label.toLowerCase()}?`)) return;
    }

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status);
        toast.success(`Order ${orderNumber} marked as ${label.toLowerCase()}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update order status:", error);
        toast.error("Failed to update order status");
      }
    });
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'secondary' as const;
      case 'CONFIRMED': return 'default' as const;
      case 'READY': return 'outline' as const;
      case 'DELIVERED': return 'default' as const;
      case 'COMPLETED': return 'secondary' as const;
      case 'CANCELLED': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const getDeliveryStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'READY': return 'Ready for Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getPickupStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'READY': return 'Ready for Pickup';
      case 'DELIVERED': return 'Picked Up';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders & Sales</h1>
            <p className="text-gray-600 mt-1">
              Manage orders from your customers
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs: Deliveries / Pickups */}
        <Tabs defaultValue="deliveries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deliveries" className="gap-2">
              <Truck className="h-4 w-4" />
              Deliveries
              {totalDeliveryOrders > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {totalDeliveryOrders}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pickups" className="gap-2">
              <MapPin className="h-4 w-4" />
              Pickups
              {totalPickupOrders > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {totalPickupOrders}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ===== Deliveries Tab ===== */}
          <TabsContent value="deliveries" className="space-y-4">
            {daysWithOrders.length > 0 ? (
              daysWithOrders.map(day => {
                const zones = deliveryOrdersByDay[day] || [];
                const totalOrders = zones.reduce((sum, zone) => sum + zone.orders.length, 0);

                return (
                  <Card key={day}>
                    <CardHeader className="bg-blue-50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          {day} Deliveries
                          <span className="text-sm font-normal text-gray-500">
                            {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
                          </span>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                      {zones.map(zone => (
                        <div key={zone.zoneId} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span>{zone.zoneName}</span>
                            <span className="text-gray-500">
                              · {zone.orders.length} {zone.orders.length === 1 ? 'order' : 'orders'}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {zone.orders.map(order => (
                              <div
                                key={order.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                              >
                                <Link href={`/dashboard/orders/${order.id}`} className="block mb-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">
                                          Order #{order.orderNumber}
                                        </span>
                                        <Badge variant={getStatusBadgeVariant(order.status)}>
                                          {getDeliveryStatusLabel(order.status)}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <User className="h-3 w-3" />
                                        <span>{order.customerName}</span>
                                        <span className="text-gray-400 mx-1">·</span>
                                        <Package className="h-3 w-3" />
                                        <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-lg font-bold text-[#8B4513]">
                                        {formatPrice(order.totalAmount)}
                                      </div>
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                </Link>

                                <div className="flex items-center gap-2 pt-3 border-t">
                                  {order.status === 'PENDING' && (
                                    <Button
                                      onClick={(e) => { e.preventDefault(); handleStatusUpdate(order.id, order.orderNumber, 'READY', 'Ready for Delivery'); }}
                                      disabled={isPending}
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Mark as Ready
                                    </Button>
                                  )}
                                  {(order.status === 'CONFIRMED' || order.status === 'READY') && (
                                    <Button
                                      onClick={(e) => { e.preventDefault(); handleStatusUpdate(order.id, order.orderNumber, 'DELIVERED', 'Delivered'); }}
                                      disabled={isPending}
                                      size="sm"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Mark as Delivered
                                    </Button>
                                  )}
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {new Date(order.deliveryDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Pending Deliveries
                  </h3>
                  <p className="text-gray-600">
                    You don&apos;t have any pending delivery orders at the moment
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== Pickups Tab ===== */}
          <TabsContent value="pickups" className="space-y-4">
            {pickupOrdersByStand.length > 0 ? (
              pickupOrdersByStand.map(stand => (
                <Card key={stand.standId}>
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-green-700" />
                      {stand.standName}
                      {stand.standLocation && (
                        <span className="text-sm font-normal text-gray-500">
                          · {stand.standLocation}
                        </span>
                      )}
                      <span className="text-sm font-normal text-gray-500">
                        · {stand.orders.length} {stand.orders.length === 1 ? 'order' : 'orders'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {stand.orders.map(order => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <Link href={`/dashboard/orders/${order.id}`} className="block mb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  Order #{order.orderNumber}
                                </span>
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {getPickupStatusLabel(order.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <User className="h-3 w-3" />
                                <span>{order.customerName}</span>
                                <span className="text-gray-400 mx-1">·</span>
                                <Package className="h-3 w-3" />
                                <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                              </div>
                              {order.pickupTime && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(order.pickupTime).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-[#8B4513]">
                                {formatPrice(order.totalAmount)}
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2 pt-3 border-t">
                          {order.status === 'PENDING' && (
                            <Button
                              onClick={(e) => { e.preventDefault(); handleStatusUpdate(order.id, order.orderNumber, 'READY', 'Ready for Pickup'); }}
                              disabled={isPending}
                              size="sm"
                              variant="outline"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Ready for Pickup
                            </Button>
                          )}
                          {(order.status === 'CONFIRMED' || order.status === 'READY') && (
                            <Button
                              onClick={(e) => { e.preventDefault(); handleStatusUpdate(order.id, order.orderNumber, 'COMPLETED', 'Completed'); }}
                              disabled={isPending}
                              size="sm"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Pending Pickups
                  </h3>
                  <p className="text-gray-600">
                    You don&apos;t have any pending pickup orders at the moment
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
