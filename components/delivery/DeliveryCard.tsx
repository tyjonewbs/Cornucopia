"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  ChevronDown,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { closeDelivery, reopenDelivery, completeDelivery, cancelDelivery } from "@/app/actions/deliveries";
import { DeliveryProductManager } from "./DeliveryProductManager";
import type { DeliveryInfo, DeliveryStatus } from "@/types/delivery";
import { toast } from "sonner";

interface DeliveryCardProps {
  delivery: DeliveryInfo;
  userProducts: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  }>;
  onUpdate?: () => void;
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  OPEN: { label: "Open", variant: "default", className: "bg-green-600 hover:bg-green-700" },
  CLOSED: { label: "Closed", variant: "outline", className: "border-amber-500 text-amber-700" },
  IN_TRANSIT: { label: "In Transit", variant: "default", className: "bg-blue-600 hover:bg-blue-700" },
  COMPLETED: { label: "Completed", variant: "secondary", className: "bg-gray-200 text-gray-600" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function DeliveryCard({ delivery, userProducts, onUpdate }: DeliveryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deliveryDate = parseISO(delivery.date);
  const statusConfig = STATUS_CONFIG[delivery.status];
  const orderCount = delivery._count?.orders || 0;

  const handleStatusChange = (action: 'close' | 'reopen' | 'complete' | 'cancel') => {
    startTransition(async () => {
      let result;
      switch (action) {
        case 'close':
          result = await closeDelivery(delivery.id);
          break;
        case 'reopen':
          result = await reopenDelivery(delivery.id);
          break;
        case 'complete':
          result = await completeDelivery(delivery.id);
          break;
        case 'cancel':
          result = await cancelDelivery(delivery.id);
          break;
      }

      if (result.success) {
        toast.success(`Delivery ${action === 'close' ? 'closed' : action === 'reopen' ? 'reopened' : action === 'complete' ? 'completed' : 'cancelled'}`);
        onUpdate?.();
      } else {
        toast.error(result.error || `Failed to ${action} delivery`);
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-base">
                {format(deliveryDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {delivery.timeWindow && (
                  <span>{delivery.timeWindow}</span>
                )}
                <span>Orders: {orderCount}</span>
                {delivery.zones.length > 0 && (
                  <span>
                    Zones: {delivery.zones.map(z => z.name).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={statusConfig.variant}
              className={statusConfig.className}
            >
              {statusConfig.label}
            </Badge>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="border-t pt-4 space-y-4">
          {/* Products summary */}
          {delivery.products.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Products ({delivery.products.length})
              </h4>
              <div className="divide-y rounded-md border">
                {delivery.products.map((dp) => (
                  <div key={dp.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {dp.product.images?.[0] && (
                        <img
                          src={dp.product.images[0]}
                          alt={dp.product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <span>{dp.product.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      Cap: {dp.cap !== null ? dp.cap : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No products added to this delivery yet.
            </p>
          )}

          {/* Product manager */}
          <DeliveryProductManager
            deliveryId={delivery.id}
            existingProducts={delivery.products}
            userProducts={userProducts}
            onUpdate={onUpdate}
          />

          {/* Note */}
          {delivery.note && (
            <p className="text-sm text-muted-foreground italic">
              Note: {delivery.note}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['SCHEDULED', 'OPEN'].includes(delivery.status) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange('close')}
                disabled={isPending}
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop Orders
              </Button>
            )}
            {delivery.status === 'CLOSED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('reopen')}
                disabled={isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reopen
              </Button>
            )}
            {!['COMPLETED', 'CANCELLED'].includes(delivery.status) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('complete')}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                {orderCount === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleStatusChange('cancel')}
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
