import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Package, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";
import { formatPrice } from "@/lib/cart/calculations";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessRoute({ searchParams }: Props) {
  const { session_id: sessionId } = await searchParams;
  const user = await getUser();

  // Only fetch order details if we have a session ID AND an authenticated user
  let order = null;
  if (sessionId && user?.id) {
    order = await prisma.order.findFirst({
      where: {
        stripeSessionId: sessionId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        marketStand: {
          select: {
            name: true,
            locationName: true,
          },
        },
      },
    });
  }

  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="w-full flex justify-center">
            <Check className="w-12 h-12 rounded-full bg-green-500/30 text-green-500 p-2" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-lg leading-6 font-medium">
              Payment Successful
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you for your purchase! Your order has been confirmed.
            </p>
          </div>

          {order && (
            <div className="mt-6 space-y-4">
              {/* Order number */}
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-mono font-semibold">{order.orderNumber}</p>
              </div>

              {/* Fulfillment info */}
              <div className="flex items-start gap-3 text-sm">
                {order.type === "DELIVERY" ? (
                  <>
                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Delivery</p>
                      {order.deliveryDate && (
                        <p className="text-muted-foreground">
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        Pickup at {order.marketStand.name}
                      </p>
                      <p className="text-muted-foreground">
                        {order.marketStand.locationName}
                      </p>
                      {order.pickupTime && (
                        <p className="text-muted-foreground">
                          {new Date(order.pickupTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Items */}
              <div className="border-t pt-3">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.priceAtTime * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button className="w-full" asChild>
              <Link href="/dashboard/purchases">View My Purchases</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
