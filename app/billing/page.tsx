import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/db";
import { formatPrice } from "@/lib/cart/calculations";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { PaymentTab } from "@/components/PaymentTab";
import Link from "next/link";
import { ExternalLink, Package, CreditCard } from "lucide-react";

export default async function BillingRoute() {
  noStore();
  const user = await getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // Fetch user's recent orders
  const orders = await prisma.order.findMany({
    where: { userId: user.id, paymentStatus: "PAID" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      marketStand: { select: { name: true } },
      items: { select: { id: true } },
    },
  });

  // Check if user is a seller with Stripe Connect
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      connectedAccountId: true,
      stripeConnectedLinked: true,
    },
  });

  const stripeConnected = !!userData?.connectedAccountId && userData.stripeConnectedLinked;

  // Fetch user's market stands for QR codes / payment setup
  const marketStands = await prisma.marketStand.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });

  const isProducer = marketStands.length > 0;

  // Calculate spending summary
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="space-y-6">
        {/* Spending summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Purchase History
            </CardTitle>
            <CardDescription>
              Your recent purchases and payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Total Spent ({orders.length} orders)
                  </p>
                  <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
                </div>

                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.marketStand.name} &middot;{" "}
                            {new Date(order.createdAt).toLocaleDateString()} &middot;{" "}
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ORDER_STATUS_LABELS[order.status]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/dashboard/orders">View All Orders</Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No purchases yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/">Start Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seller payment setup - Stripe Connect + QR codes */}
        {isProducer && (
          <PaymentTab
            marketStands={marketStands}
            stripeConnected={stripeConnected}
          />
        )}
      </div>
    </section>
  );
}
