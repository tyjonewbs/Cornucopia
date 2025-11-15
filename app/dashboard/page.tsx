import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserProducerInfo } from "@/lib/utils/user";
import prisma from "@/lib/db";
import { ShoppingBag, Heart, Star, Store, Package, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BecomeProducerCTA } from "@/components/dashboard/BecomeProducerCTA";

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }

  const { isProducer, productCount } = await getUserProducerInfo(user.id);

  // Fetch consumer stats
  const [orderCount, savedProductsCount, subscriptionCount] = await Promise.all([
    prisma.order.count({
      where: { userId: user.id }
    }),
    prisma.savedProduct.count({
      where: { userId: user.id }
    }),
    prisma.marketStandSubscription.count({
      where: { userId: user.id }
    }),
  ]);

  // Fetch producer stats if user is a producer
  let producerStats = null;
  if (isProducer) {
    const [standCount, lowInventoryCount, pendingOrdersCount, totalRevenue] = await Promise.all([
      prisma.marketStand.count({
        where: {
          userId: user.id,
          isActive: true
        }
      }),
      prisma.product.count({
        where: {
          userId: user.id,
          isActive: true,
          inventory: {
            lte: 5,
            gt: 0
          }
        }
      }),
      prisma.order.count({
        where: {
          marketStand: {
            userId: user.id
          },
          status: 'PENDING'
        }
      }),
      prisma.order.aggregate({
        where: {
          marketStand: {
            userId: user.id
          },
          status: {
            in: ['COMPLETED', 'READY']
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    producerStats = {
      standCount,
      lowInventoryCount,
      pendingOrdersCount,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    };
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user.firstName || user.email}!
        </p>
      </div>

      {/* Consumer Stats - Visible to All Users */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderCount}</div>
              <p className="text-xs text-muted-foreground">Total orders placed</p>
              <Link href="/dashboard/my-local-haul">
                <Button variant="link" className="p-0 h-auto mt-2">
                  View all orders →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Products</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedProductsCount}</div>
              <p className="text-xs text-muted-foreground">Items in your favorites</p>
              <Link href="/dashboard/my-local-haul">
                <Button variant="link" className="p-0 h-auto mt-2">
                  View favorites →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptionCount}</div>
              <p className="text-xs text-muted-foreground">Following market stands</p>
              <Link href="/dashboard/my-local-haul">
                <Button variant="link" className="p-0 h-auto mt-2">
                  Manage subscriptions →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Producer Stats - Only for Producers */}
      {isProducer && producerStats && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Producer Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productCount}</div>
                <p className="text-xs text-muted-foreground">Active listings</p>
                <Link href="/dashboard/market-stand">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage products →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Stands</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{producerStats.standCount}</div>
                <p className="text-xs text-muted-foreground">Active stands</p>
                <Link href="/dashboard/market-stand">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage stands →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{producerStats.pendingOrdersCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
                <Link href="/dashboard/orders">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    View orders →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(producerStats.totalRevenue / 100).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total sales</p>
                <Link href="/dashboard/analytics">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    View analytics →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Low Inventory Alert */}
          {producerStats.lowInventoryCount > 0 && (
            <Card className="mt-4 border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-900">Low Inventory Alert</CardTitle>
                </div>
                <CardDescription className="text-orange-700">
                  {producerStats.lowInventoryCount} {producerStats.lowInventoryCount === 1 ? 'product has' : 'products have'} low inventory (5 or fewer items)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/market-stand">
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                    Update Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CTA for Non-Producers */}
      {!isProducer && <BecomeProducerCTA />}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Browse Market Stands</CardTitle>
              <CardDescription>
                Discover local farms and producers in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/market-stand/grid">
                <Button variant="outline" className="w-full">
                  Explore Stands
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">My Local Haul</CardTitle>
              <CardDescription>
                View your orders, favorites, and subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/my-local-haul">
                <Button variant="outline" className="w-full">
                  View Activity
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
