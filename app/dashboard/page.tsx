import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { AlertCircle, Package, Truck, ShoppingBag, Calendar, Store, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StandTogglePill } from "@/components/dashboard/StandTogglePill";
import { InlineProductList } from "@/components/dashboard/InlineProductList";
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
        deliveryType: true,
        productListings: {
          include: {
            product: {
              select: {
                id: true, name: true, price: true,
                images: true, inventory: true, updatedAt: true, status: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          distinct: ['productId']
        }
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
      {stands.map((stand, idx) => {
        // Filter to only show approved, active products
        const activeProducts = stand.productListings
          .filter(listing => listing.product.isActive)
          .slice(0, 5);
        const productCount = activeProducts.length;
        const totalProducts = stand.productListings.filter(listing => listing.product.isActive).length;
        const lastRestock = activeProducts[0]?.updatedAt;

        return (
          <div key={stand.id}>
            {/* Visual separator between stands */}
            {idx > 0 && <div className="border-t border-gray-200 my-4" />}

            {/* Stand header row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="h-5 w-5 text-[#0B4D2C] flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate">{stand.name}</h3>
                  {lastRestock && (
                    <p className="text-xs text-gray-500">Restocked {timeAgo(lastRestock)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StandTogglePill standId={stand.id} isOpen={stand.isOpen} hours={stand.hours as any} />
                <Link href={`/dashboard/market-stand/setup/edit/${stand.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Products */}
            <InlineProductList
              mode="stand"
              contextId={stand.id}
              userId={user.id}
              products={activeProducts.map(listing => ({
                listingId: listing.id,
                productId: listing.product.id,
                name: listing.product.name,
                price: listing.customPrice ?? listing.product.price,
                images: listing.product.images,
                inventory: listing.customInventory ?? listing.product.inventory,
                updatedAt: listing.updatedAt instanceof Date ? listing.updatedAt.toISOString() : listing.updatedAt,
                status: listing.product.status,
              }))}
            />
          </div>
        );
      })}

      {/* Add Stand button — after all stands */}
      <Link href="/dashboard/market-stand/setup/new">
        <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mt-2">
          <Plus className="h-4 w-4" />
          Add Stand
        </button>
      </Link>

      {/* Delivery zones */}
      {deliveryZones.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-6" />
          <div className="space-y-3">
            {deliveryZones.map((zone) => (
              <div key={zone.id}>
                {/* Zone header row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{zone.name}</h3>
                      <p className="text-xs text-gray-500">
                        {zone.zipCodes.slice(0, 2).join(', ')}
                        {zone.zipCodes.length > 2 && ` +${zone.zipCodes.length - 2}`}
                        {' · '}
                        {zone.deliveryDays.slice(0, 2).join(', ')}
                        {' · '}
                        {zone.deliveryFee === 0 ? 'Free' : `$${(zone.deliveryFee / 100).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                  <Link href={`/dashboard/delivery-zones/${zone.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Zone products */}
                <InlineProductList
                  mode="delivery"
                  contextId={zone.id}
                  userId={user.id}
                  products={zone.productListings.map(listing => ({
                    listingId: listing.id,
                    productId: listing.product.id,
                    name: listing.product.name,
                    price: listing.product.price,
                    images: listing.product.images,
                    inventory: listing.inventory,
                    updatedAt: listing.updatedAt.toISOString(),
                    status: listing.product.status,
                  }))}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Delivery Zone button */}
      <Link href="/dashboard/delivery-zones/new">
        <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mt-2">
          <Plus className="h-4 w-4" />
          Add Delivery Zone
        </button>
      </Link>

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
      <div className="border-t border-gray-100 my-6" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Events
          </h3>
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-500 mb-3">No upcoming events</p>
        ) : (
          <div className="space-y-2 mb-3">
            {upcomingEvents.map((eventVendor) => (
              <div key={eventVendor.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{eventVendor.event.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(eventVendor.event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}{eventVendor.event.locationName}
                  </p>
                </div>
                <Link href={`/events/${eventVendor.event.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">View →</Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Add Event dashed button */}
        <Link href="/dashboard/events/setup/new">
          <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </Link>
      </div>
    </div>
  );
}
