import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getUserProducerInfo } from "@/lib/utils/user";
import prisma from "@/lib/db";
import { ShoppingBag, Heart, Star, Store, Package, TrendingUp, AlertCircle, CreditCard } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BecomeProducerCTA } from "@/components/dashboard/BecomeProducerCTA";
import { StandStatusCard } from "@/components/dashboard/StandStatusCard";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const { isProducer, productCount } = await getUserProducerInfo(user.id);

  // Fetch firstName from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true }
  });

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
  let firstActiveStand = null;
  if (isProducer) {
    const [standCount, lowInventoryCount, pendingOrdersCount, totalRevenue, producerDbUser, firstStand] = await Promise.all([
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
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeConnectedLinked: true }
      }),
      prisma.marketStand.findFirst({
        where: {
          userId: user.id,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          isOpen: true,
          hours: true
        }
      })
    ]);

    firstActiveStand = firstStand;

    producerStats = {
      standCount,
      lowInventoryCount,
      pendingOrdersCount,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      stripeConnected: producerDbUser?.stripeConnectedLinked ?? false
    };
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Welcome back";
  };

  // Get display name
  const displayName = user.user_metadata?.first_name || dbUser?.firstName || user.email?.split("@")[0] || "there";

  // Fetch nearby stands for empty state
  let nearbyStands = null;
  if (!isProducer && orderCount === 0 && savedProductsCount === 0) {
    nearbyStands = await prisma.marketStand.findMany({
      where: {
        isActive: true,
        status: "APPROVED"
      },
      take: 3,
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        name: true,
        locationName: true,
        isOpen: true
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {getGreeting()}, {displayName}!
        </p>
      </div>

      {/* Consumer Stats - Visible to All Users */}
      {orderCount > 0 || savedProductsCount > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Activity</h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <ShoppingBag className="h-5 w-5 text-[#0B4D2C]" />
                  <CardTitle className="text-xs font-medium text-muted-foreground">Orders</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 text-center">
                <div className="text-2xl font-bold">{orderCount}</div>
                <Link href="/dashboard/purchases">
                  <Button variant="link" className="p-0 h-auto mt-1 text-xs">
                    View →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <Heart className="h-5 w-5 text-[#0B4D2C]" />
                  <CardTitle className="text-xs font-medium text-muted-foreground">Saved</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 text-center">
                <div className="text-2xl font-bold">{savedProductsCount}</div>
                <Link href="/dashboard/my-local-haul">
                  <Button variant="link" className="p-0 h-auto mt-1 text-xs">
                    View →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <Star className="h-5 w-5 text-[#0B4D2C]" />
                  <CardTitle className="text-xs font-medium text-muted-foreground">Following</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 text-center">
                <div className="text-2xl font-bold">{subscriptionCount}</div>
                <Link href="/dashboard/my-local-haul">
                  <Button variant="link" className="p-0 h-auto mt-1 text-xs">
                    Manage →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty state - Nearby Stands */
        <div>
          <h2 className="text-xl font-semibold mb-4">Discover what's near you</h2>
          {nearbyStands && nearbyStands.length > 0 ? (
            <div className="space-y-3">
              {nearbyStands.map((stand) => (
                <Link key={stand.id} href={`/market-stand/${stand.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">{stand.name}</h3>
                        <p className="text-sm text-gray-600">{stand.locationName}</p>
                      </div>
                      <div>
                        {stand.isOpen ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                            Open
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                            Closed
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              <Link href="/market-stand/grid">
                <Button className="w-full bg-[#8B4513] hover:bg-[#6B3410]">
                  Browse all stands
                </Button>
              </Link>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600">No market stands available yet. Check back soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Producer Stats - Only for Producers */}
      {isProducer && producerStats && (
        <div>
          {/* Stripe Warning Banner */}
          {!producerStats.stripeConnected && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-900 font-medium">
                    Payment setup incomplete — connect Stripe to receive payments
                  </p>
                </div>
                <Link href="/api/stripe/connect">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Connect Stripe
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Low Inventory Alert Banner */}
          {producerStats.lowInventoryCount > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-900 font-medium">
                    {producerStats.lowInventoryCount} product{producerStats.lowInventoryCount !== 1 ? 's' : ''} running low
                  </p>
                </div>
                <Link href="/dashboard/products">
                  <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                    Update now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <h2 className="text-xl font-semibold mb-4">Producer Overview</h2>

          {/* Stand Status Card */}
          {firstActiveStand && (
            <div className="mb-4">
              <StandStatusCard
                standId={firstActiveStand.id}
                standName={firstActiveStand.name}
                isOpen={firstActiveStand.isOpen}
                hours={firstActiveStand.hours as any}
              />
            </div>
          )}

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

            <Card className={producerStats.pendingOrdersCount > 0 ? "border-red-200 bg-red-50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${producerStats.pendingOrdersCount > 0 ? "text-red-900" : ""}`}>
                  Pending Orders
                </CardTitle>
                <ShoppingBag className={`h-4 w-4 ${producerStats.pendingOrdersCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${producerStats.pendingOrdersCount > 0 ? "text-red-900" : ""}`}>
                  {producerStats.pendingOrdersCount}
                </div>
                {producerStats.pendingOrdersCount > 0 ? (
                  <p className="text-xs text-red-700 font-medium">Need attention now</p>
                ) : (
                  <p className="text-xs text-green-700 font-medium">All caught up ✓</p>
                )}
                <Link href="/dashboard/orders">
                  <Button variant="link" className={`p-0 h-auto mt-2 ${producerStats.pendingOrdersCount > 0 ? "text-red-700" : ""}`}>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Billing</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {producerStats.stripeConnected ? "Connected" : "Setup"}
                </div>
                <p className="text-xs text-muted-foreground">Payment settings</p>
                <Link href="/billing">
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage billing →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
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
              <CardTitle className="text-lg">Explore Local</CardTitle>
              <CardDescription>
                Discover local farms, market stands, and events near you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/market-stand">
                <Button variant="outline" className="w-full">
                  Explore Map
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
