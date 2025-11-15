"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { 
  Calendar,
  Truck,
  MapPin,
  User,
  Package,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryOrdersByDay, DeliveryOrder, updateOrderStatus } from "@/app/actions/orders";
import { formatPrice } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";

interface OrdersClientProps {
  ordersByDay: DeliveryOrdersByDay;
}

export default function OrdersClient({ ordersByDay }: OrdersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Filter to only show days that have orders
  const daysWithOrders = DAYS.filter(day => ordersByDay[day]?.length > 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Orders refreshed");
    }, 500);
  };

  const handleMarkAsDelivered = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Mark order ${orderNumber} as delivered?`)) return;

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, 'DELIVERED');
        toast.success("Order marked as delivered");
        router.refresh();
      } catch (error) {
        console.error("Failed to update order status:", error);
        toast.error("Failed to update order status");
      }
    });
  };

  const handleMarkAsReady = async (orderId: string, orderNumber: string) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, 'READY');
        toast.success(`Order ${orderNumber} marked as ready for delivery`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update order status:", error);
        toast.error("Failed to update order status");
      }
    });
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'CONFIRMED':
        return 'default';
      case 'READY':
        return 'outline';
      case 'DELIVERED':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'READY':
        return 'Ready for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders & Deliveries</h1>
            <p className="text-gray-600 mt-1">
              Manage your delivery orders organized by day and delivery zone
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

        {/* Days with Orders */}
        {daysWithOrders.length > 0 ? (
          daysWithOrders.map(day => {
            const zones = ordersByDay[day] || [];
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
                  {/* Zones */}
                  {zones.map(zone => (
                    <div key={zone.zoneId} className="space-y-3">
                      {/* Zone Header */}
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span>{zone.zoneName}</span>
                        <span className="text-gray-500">
                          • {zone.orders.length} {zone.orders.length === 1 ? 'order' : 'orders'}
                        </span>
                      </div>

                      {/* Orders */}
                      <div className="space-y-3">
                        {zone.orders.map(order => (
                          <div
                            key={order.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            {/* Order Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">
                                    Order #{order.orderNumber}
                                  </span>
                                  <Badge variant={getStatusBadgeVariant(order.status)}>
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{order.customerName}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-[#8B4513]">
                                  {formatPrice(order.totalAmount)}
                                </div>
                              </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="flex items-start gap-2 text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                              <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                              <span>{order.deliveryAddress}</span>
                            </div>

                            {/* Products */}
                            <div className="space-y-2 mb-3">
                              <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                Products:
                              </div>
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 pl-5"
                                >
                                  {/* Product Image */}
                                  {item.productImage && (
                                    <div className="relative w-12 h-12 flex-shrink-0">
                                      <Image
                                        src={item.productImage}
                                        alt={item.productName}
                                        fill
                                        className="object-cover rounded"
                                        sizes="48px"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {item.quantity}x {item.productName}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {formatPrice(item.priceAtTime)} each
                                    </div>
                                  </div>
                                  
                                  {/* Item Total */}
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatPrice(item.priceAtTime * item.quantity)}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                                <span className="font-medium">Note:</span> {order.notes}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t">
                              {order.status === 'PENDING' && (
                                <Button
                                  onClick={() => handleMarkAsReady(order.id, order.orderNumber)}
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
                                  onClick={() => handleMarkAsDelivered(order.id, order.orderNumber)}
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
          /* Empty State */
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Deliveries
              </h3>
              <p className="text-gray-600 mb-6">
                You don't have any pending delivery orders at the moment
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
