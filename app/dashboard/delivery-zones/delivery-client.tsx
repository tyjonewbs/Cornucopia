"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar,
  Truck,
  MapPin,
  User,
  Package,
  Check,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeliveryZone } from "@/types/delivery";
import { DeliveryOrdersByDay } from "@/app/actions/orders";
import { deleteDeliveryZone } from "@/app/actions/delivery-zones";
import { updateOrderStatus } from "@/app/actions/orders";
import { formatPrice } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";

interface DeliveryClientProps {
  zones: DeliveryZone[];
  ordersByDay: DeliveryOrdersByDay;
}

export default function DeliveryClient({ zones, ordersByDay }: DeliveryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Deliveries refreshed");
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

  const handleOrderStatusUpdate = async (orderId: string, orderNumber: string, newStatus: OrderStatus) => {
    const statusLabel = newStatus === 'READY' ? 'packed' : 'delivered';
    if (!confirm(`Mark order ${orderNumber} as ${statusLabel}?`)) return;

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success(`Order ${orderNumber} marked as ${statusLabel}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update order status:", error);
        toast.error("Failed to update order status");
      }
    });
  };

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
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
      default:
        return status;
    }
  };

  const formatDeliveryWindow = (zone: DeliveryZone) => {
    if (zone.deliveryTimeWindows && Array.isArray(zone.deliveryTimeWindows) && zone.deliveryTimeWindows.length > 0) {
      const window = zone.deliveryTimeWindows[0] as any;
      return `${window.startTime} - ${window.endTime}`;
    }
    return 'All day';
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your delivery runs organized by day and delivery zone
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

        {/* Days with Deliveries */}
        {DAYS.map(day => {
          const dayZones = zones.filter(z => z.isActive && z.deliveryDays.includes(day));
          const dayOrders = ordersByDay[day] || [];
          
          if (dayZones.length === 0) return null;

          const totalOrders = dayOrders.reduce((sum, zoneData) => sum + zoneData.orders.length, 0);
          
          return (
            <Card key={day} className="overflow-hidden">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {day} Deliveries
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} total
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {dayZones.map(zone => {
                  const zoneOrdersData = dayOrders.find(d => d.zoneId === zone.id);
                  const zoneOrders = zoneOrdersData?.orders || [];
                  const productTypes = [...new Set(
                    zoneOrders.flatMap(o => o.items.map(i => i.productName))
                  )];

                  return (
                    <Collapsible
                      key={zone.id}
                      open={expandedZones.has(zone.id)}
                      onOpenChange={() => toggleZone(zone.id)}
                    >
                      <div className="border rounded-lg">
                        {/* Zone Header */}
                        <div className="p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="flex-1 justify-start hover:bg-gray-100">
                                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="font-semibold">{zone.name}</span>
                                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${expandedZones.has(zone.id) ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            
                            {/* Zone Actions */}
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
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Orders:</span>
                              <span className="font-semibold ml-2">{zoneOrders.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Products:</span>
                              <span className="font-semibold ml-2">
                                {productTypes.length > 0 ? (
                                  <>
                                    {productTypes.slice(0, 2).join(', ')}
                                    {productTypes.length > 2 && ` +${productTypes.length - 2} more`}
                                  </>
                                ) : (
                                  'None'
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Window:</span>
                              <span className="font-semibold ml-2">{formatDeliveryWindow(zone)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Orders */}
                        <CollapsibleContent>
                          <div className="p-4 border-t bg-white space-y-3">
                            {zoneOrders.length > 0 ? (
                              zoneOrders.map(order => {
                                const isExpanded = expandedOrders.has(order.id);
                                const visibleItems = isExpanded ? order.items : order.items.slice(0, 3);
                                
                                return (
                                  <div key={order.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
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
                                      <div className="text-lg font-bold text-[#8B4513]">
                                        {formatPrice(order.totalAmount)}
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
                                      {visibleItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 pl-5">
                                          {item.productImage && (
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                              <Image
                                                src={item.productImage}
                                                alt={item.productName}
                                                fill
                                                className="object-cover rounded"
                                                sizes="40px"
                                              />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                              {item.quantity}x {item.productName}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {formatPrice(item.priceAtTime)} each
                                            </div>
                                          </div>
                                          <div className="text-sm font-semibold text-gray-900">
                                            {formatPrice(item.priceAtTime * item.quantity)}
                                          </div>
                                        </div>
                                      ))}
                                      {order.items.length > 3 && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          onClick={() => toggleOrder(order.id)}
                                          className="pl-5 h-auto p-0 text-blue-600"
                                        >
                                          {isExpanded 
                                            ? 'Show less' 
                                            : `+ ${order.items.length - 3} more items`
                                          }
                                        </Button>
                                      )}
                                    </div>

                                    {/* Notes */}
                                    {order.notes && (
                                      <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                                        <span className="font-medium">Note:</span> {order.notes}
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-3 border-t">
                                      <Button size="sm" variant="outline">
                                        <Printer className="h-4 w-4 mr-1" />
                                        Print Slip
                                      </Button>
                                      {order.status === 'PENDING' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleOrderStatusUpdate(order.id, order.orderNumber, 'READY')}
                                          disabled={isPending}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Mark Packed
                                        </Button>
                                      )}
                                      {(order.status === 'CONFIRMED' || order.status === 'READY') && (
                                        <Button 
                                          size="sm"
                                          onClick={() => handleOrderStatusUpdate(order.id, order.orderNumber, 'DELIVERED')}
                                          disabled={isPending}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Mark Delivered
                                        </Button>
                                      )}
                                      <span className="text-xs text-gray-500 ml-auto">
                                        {new Date(order.deliveryDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                                <p>No orders for {zone.name} on {day}</p>
                              </div>
                            )}
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
        {zones.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No delivery zones yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first delivery zone to start managing deliveries
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
    </div>
  );
}
