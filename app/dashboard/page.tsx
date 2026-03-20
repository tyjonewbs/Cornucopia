import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { AlertCircle, Package, Truck, ShoppingBag, Calendar } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StandStatusCard } from "@/components/dashboard/StandStatusCard";
import Image from "next/image";

// Helper to calculate time ago
function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Helper to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch all data in parallel
  const [
    dbUser,
    stands,
    deliveryZones,
    pendingOrdersCount,
    upcomingEvents,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        role: true,
        stripeConnectedLinked: true
      }
    }),
    prisma.marketStand.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        productListings: {
          where: { isActive: true },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                inventory: true,
                images: true,
                updatedAt: true,
                status: true,
                isActive: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 5
        }
      }
    }),
    prisma.deliveryZone.findMany({
      where: { userId: user.id, isActive: true },
      select: {
        id: true,
        name: true,
        zipCodes: true,
        deliveryDays: true,
        deliveryFee: true,
        deliveryType: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.order.count({
      where: {
        marketStand: { userId: user.id },
        status: 'PENDING'
      }
    }),
    prisma.eventVendor.findMany({
      where: {
        vendorId: user.id,
        status: 'APPROVED',
        event: {
          status: 'APPROVED',
          startDate: { gte: new Date() }
        }
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            locationName: true
          }
        }
      },
      take: 3,
      orderBy: { event: { startDate: 'asc' } }
    })
  ]);

  // Check if user is a producer
  const isProducer = stands.length > 0;

  // Get display name and greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Welcome back";
  };

  const displayName = user.user_metadata?.first_name || dbUser?.firstName || user.email?.split("@")[0] || "there";

  // If not a producer, show setup CTA
  if (!isProducer) {
    return (
      <div className="space-y-6 pb-24 md:pb-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {getGreeting()}, {displayName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to start selling?
          </p>
        </div>

        <Card className="border-2 border-[#8B4513]">
          <CardContent className="p-8 text-center">
            <Package className="h-16 w-16 text-[#8B4513] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Become a Producer</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Set up your producer profile to start selling your products on Cornucopia
            </p>
            <Link href="/onboarding/producer">
              <Button size="lg" className="bg-[#8B4513] hover:bg-[#6B3410]">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Producer dashboard
  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {getGreeting()}, {displayName}!
        </h1>
      </div>

      {/* Stripe warning banner */}
      {!dbUser?.stripeConnectedLinked && (
        <Card className="border-red-200 bg-red-50">
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

      {/* Stands */}
      {stands.map((stand) => {
        // Filter to only show approved, active products
        const activeProducts = stand.productListings
          .filter(listing => listing.product.isActive)
          .slice(0, 5);
        const productCount = activeProducts.length;
        const totalProducts = stand.productListings.filter(listing => listing.product.isActive).length;
        const lastRestock = activeProducts[0]?.updatedAt;

        return (
          <div key={stand.id}>
            <div className="border-t border-gray-100 my-6" />

            {/* Stand header with status toggle */}
            <div className="mb-4">
              <StandStatusCard
                standId={stand.id}
                standName={stand.name}
                isOpen={stand.isOpen}
                hours={stand.hours as any}
              />
              {lastRestock && (
                <p className="text-sm text-gray-500 mt-1 ml-1">
                  Last restocked {timeAgo(lastRestock)}
                </p>
              )}
              <div className="flex gap-2 mt-2 ml-1">
                <Link href={`/dashboard/market-stand`}>
                  <Button variant="outline" size="sm">
                    Edit Stand
                  </Button>
                </Link>
              </div>
            </div>

            {/* Products section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  Products
                </h3>
                <Link href="/onboarding/producer">
                  <Button variant="outline" size="sm">
                    + Add Product
                  </Button>
                </Link>
              </div>

              {productCount === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No products yet. Add your first product to get started!
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {activeProducts.map((listing) => {
                    const product = listing.product;
                    const inventory = listing.customInventory ?? product.inventory;
                    return (
                      <Card key={listing.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          {product.images[0] && (
                            <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              {product.status === 'PENDING' && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Pending review</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              ${((listing.customPrice ?? product.price) / 100).toFixed(2)} · {inventory} left
                            </p>
                            <p className="text-xs text-gray-400">
                              Updated {timeAgo(listing.updatedAt)}
                            </p>
                          </div>
                          <Link href="/dashboard/products">
                            <Button variant="ghost" size="sm">
                              Edit →
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {totalProducts > 5 && (
                    <Link href="/dashboard/products">
                      <Button variant="link" className="w-full">
                        View all {totalProducts} products →
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Delivery zones section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-600" />
                  Delivery Zones
                </h3>
                <Link href="/dashboard/delivery-zones/new">
                  <Button variant="outline" size="sm">
                    + Add Zone
                  </Button>
                </Link>
              </div>

              {deliveryZones.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No delivery zones set up yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {deliveryZones.map((zone) => (
                    <Card key={zone.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Truck className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{zone.name}</h4>
                          <p className="text-xs text-gray-600">
                            {zone.zipCodes.slice(0, 3).join(', ')}
                            {zone.zipCodes.length > 3 && ` +${zone.zipCodes.length - 3} more`}
                            {' · '}
                            {zone.deliveryDays.slice(0, 2).join(', ')}
                            {zone.deliveryDays.length > 2 && ` +${zone.deliveryDays.length - 2}`}
                            {' · '}
                            ${(zone.deliveryFee / 100).toFixed(2)} fee
                          </p>
                        </div>
                        <Link href={`/dashboard/delivery-zones`}>
                          <Button variant="ghost" size="sm">
                            Edit →
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="border-t border-gray-100 my-6" />

      {/* Orders section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-600" />
            Orders
          </h3>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              View all →
            </Button>
          </Link>
        </div>
        <Card className={pendingOrdersCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="p-4 text-center">
            {pendingOrdersCount > 0 ? (
              <>
                <p className="text-2xl font-bold text-red-900">{pendingOrdersCount}</p>
                <p className="text-sm text-red-700 font-medium">pending {pendingOrdersCount === 1 ? 'order' : 'orders'} need attention</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">No pending orders — all caught up!</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events section */}
      {upcomingEvents.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-6" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Upcoming Events
              </h3>
              <Link href="/dashboard/events">
                <Button variant="outline" size="sm">
                  + Create Event
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((eventVendor) => (
                <Card key={eventVendor.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{eventVendor.event.name}</h4>
                      <p className="text-xs text-gray-600">
                        {formatDate(eventVendor.event.startDate)} · {eventVendor.event.locationName}
                      </p>
                    </div>
                    <Link href={`/events/${eventVendor.event.id}`}>
                      <Button variant="ghost" size="sm">
                        View →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
