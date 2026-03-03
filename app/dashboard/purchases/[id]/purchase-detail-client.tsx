"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  Store,
  Truck,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/cart/calculations";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { ReportIssueDialog } from "@/components/ReportIssueDialog";
import type { PurchaseDetail, OrderIssueData } from "@/app/actions/orders";

interface PurchaseDetailClientProps {
  purchase: PurchaseDetail;
}

function getStatusBadgeVariant(status: OrderStatus) {
  switch (status) {
    case "PENDING": return "secondary" as const;
    case "CONFIRMED": return "default" as const;
    case "READY": return "outline" as const;
    case "DELIVERED": return "default" as const;
    case "COMPLETED": return "secondary" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

function getStatusLabel(status: OrderStatus, type: string) {
  switch (status) {
    case "PENDING": return "Order Placed";
    case "CONFIRMED": return "Confirmed";
    case "READY": return type === "PICKUP" ? "Ready for Pickup" : "Out for Delivery";
    case "DELIVERED": return "Delivered";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
    default: return status;
  }
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case "PAID": return "Paid";
    case "UNPAID": return "Unpaid";
    case "REFUNDED": return "Refunded";
    case "PARTIALLY_REFUNDED": return "Partially Refunded";
    case "FAILED": return "Failed";
    default: return status;
  }
}

function getPaymentBadgeVariant(status: string) {
  switch (status) {
    case "PAID": return "default" as const;
    case "UNPAID": return "secondary" as const;
    case "REFUNDED": return "destructive" as const;
    case "PARTIALLY_REFUNDED": return "outline" as const;
    case "FAILED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

function getIssueTypeLabel(type: string) {
  switch (type) {
    case "NOT_DELIVERED": return "Not Delivered";
    case "WRONG_ITEMS": return "Wrong Items";
    case "DAMAGED": return "Damaged";
    case "POOR_QUALITY": return "Poor Quality";
    case "LATE": return "Late";
    case "OTHER": return "Other";
    default: return type;
  }
}

function getIssueStatusBadgeVariant(status: string) {
  switch (status) {
    case "PENDING": return "secondary" as const;
    case "INVESTIGATING": return "outline" as const;
    case "RESOLVED": return "default" as const;
    case "REFUNDED": return "default" as const;
    case "ESCALATED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default function PurchaseDetailClient({ purchase }: PurchaseDetailClientProps) {
  const router = useRouter();
  const isDelivery = purchase.type === "DELIVERY";

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{purchase.orderNumber}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={getStatusBadgeVariant(purchase.status)}>
                {getStatusLabel(purchase.status, purchase.type)}
              </Badge>
              <Badge variant={getPaymentBadgeVariant(purchase.paymentStatus)}>
                <CreditCard className="h-3 w-3 mr-1" />
                {getPaymentStatusLabel(purchase.paymentStatus)}
              </Badge>
              {purchase.hasActiveIssue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Issue Reported
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-[#8B4513]">
              {formatPrice(purchase.totalAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(purchase.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Market Stand */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4" />
              Market Stand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/market-stand/${purchase.marketStandId}`}
              className="text-sm font-medium text-[#8B4513] hover:underline"
            >
              {purchase.marketStandName}
            </Link>
            {purchase.marketStandLocation && (
              <p className="text-sm text-gray-500 mt-0.5">{purchase.marketStandLocation}</p>
            )}
          </CardContent>
        </Card>

        {/* Fulfillment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isDelivery ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {isDelivery ? "Delivery Details" : "Pickup Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isDelivery ? (
              <>
                {purchase.deliveryAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <span>{purchase.deliveryAddress}</span>
                  </div>
                )}
                {purchase.deliveryDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>{new Date(purchase.deliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {purchase.deliveryZoneName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>Zone: {purchase.deliveryZoneName}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {purchase.pickupTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>{new Date(purchase.pickupTime).toLocaleString()}</span>
                  </div>
                )}
                {purchase.marketStandLocation && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span>{purchase.marketStandLocation}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items ({purchase.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchase.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {item.productImage ? (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
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
                  <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatPrice(item.priceAtTime * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <Separator className="my-4" />
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(purchase.subtotal)}</span>
              </div>
              {purchase.fees > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(purchase.fees)}</span>
                </div>
              )}
              {purchase.tax > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(purchase.tax)}</span>
                </div>
              )}
              <Separator className="my-1.5" />
              <div className="flex justify-between text-sm font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(purchase.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {purchase.notes && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
                <span className="font-medium">Note:</span> {purchase.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Issue */}
        {!purchase.hasActiveIssue && purchase.status !== "CANCELLED" && (
          <Card>
            <CardContent className="pt-6">
              <ReportIssueDialog
                orderId={purchase.id}
                orderNumber={purchase.orderNumber}
                onSuccess={() => router.refresh()}
              />
            </CardContent>
          </Card>
        )}

        {/* Issues */}
        {purchase.issues.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Reported Issues ({purchase.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchase.issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-400 flex items-center gap-4">
          <span>Ordered: {new Date(purchase.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(purchase.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: OrderIssueData }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{getIssueTypeLabel(issue.issueType)}</span>
          <Badge variant={getIssueStatusBadgeVariant(issue.status)}>
            {issue.status.charAt(0) + issue.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(issue.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600">{issue.description}</p>
      {issue.resolution && (
        <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
          <span className="font-medium">Resolution:</span> {issue.resolution}
        </div>
      )}
      {issue.refundAmount != null && issue.refundAmount > 0 && (
        <div className="text-sm text-gray-600">
          Refund: {formatPrice(issue.refundAmount)}
          {issue.resolvedAt && (
            <span className="text-gray-400"> · {new Date(issue.resolvedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
