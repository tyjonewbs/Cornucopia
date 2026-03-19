import prisma from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Truck, Package, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductHamburgerRow } from "@/components/tiles/ProductHamburgerRow";
import type { SerializedProduct } from "@/app/actions/home-products";

async function getData(encodedId: string) {
  try {
    const id = decodeURIComponent(encodedId);

    const zone = await prisma.deliveryZone.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            profileImage: true
          }
        },
        products: {
          where: {
            isActive: true,
            status: "APPROVED"
          },
          include: {
            deliveryListings: {
              where: { deliveryZoneId: id },
              select: {
                inventory: true,
                dayOfWeek: true
              }
            }
          },
          orderBy: { updatedAt: "desc" }
        }
      }
    });

    if (!zone || !zone.isActive) return null;

    // Map products to SerializedProduct format
    const serializedProducts: SerializedProduct[] = zone.products.map((product) => {
      // Sum delivery inventory across all days for this zone
      const deliveryInventory = product.deliveryListings.reduce(
        (sum, listing) => sum + (listing.inventory || 0),
        0
      );

      // Get unique delivery days for this product
      const deliveryDays = Array.from(
        new Set(product.deliveryListings.map((listing) => listing.dayOfWeek))
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        images: product.images,
        inventory: deliveryInventory, // Use delivery inventory sum
        tags: product.tags,
        adminTags: product.adminTags || [],
        inventoryUpdatedAt: product.inventoryUpdatedAt?.toISOString() || null,
        isActive: product.isActive,
        deliveryAvailable: true,
        availableDate: product.availableDate?.toISOString() || null,
        availableUntil: product.availableUntil?.toISOString() || null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        status: product.status,
        userId: product.userId,
        marketStandId: product.marketStandId,
        deliveryZoneId: product.deliveryZoneId,
        totalReviews: 0,
        averageRating: null,
        // Provide a placeholder market stand (ProductHamburgerRow checks for null)
        marketStand: {
          id: '',
          name: '',
          latitude: 0,
          longitude: 0,
          locationName: '',
          user: {
            firstName: zone.user.firstName || '',
            profileImage: zone.user.profileImage || '',
          }
        },
        distance: null,
        availableAt: [],
        deliveryInfo: {
          isAvailable: true,
          deliveryFee: zone.deliveryFee,
          zoneName: zone.name,
          zoneId: zone.id,
          minimumOrder: zone.minimumOrder,
          freeDeliveryThreshold: zone.freeDeliveryThreshold,
          deliveryDays: deliveryDays,
        },
        badge: null,
      };
    });

    return {
      id: zone.id,
      name: zone.name,
      description: zone.description || null,
      deliveryFee: zone.deliveryFee,
      freeDeliveryThreshold: zone.freeDeliveryThreshold,
      minimumOrder: zone.minimumOrder,
      deliveryDays: zone.deliveryDays,
      zipCodes: zone.zipCodes,
      cities: zone.cities,
      user: zone.user,
      products: serializedProducts,
    };
  } catch (err) {
    console.error("Error fetching delivery zone:", err);
    return null;
  }
}

function getNextDeliveryDay(deliveryDays: string[]): string | null {
  if (!deliveryDays.length) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();

  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (today + offset) % 7;
    const dayName = dayNames[dayIndex];
    if (deliveryDays.includes(dayName)) {
      if (offset === 0) return 'Today';
      if (offset === 1) return 'Tomorrow';
      return dayName;
    }
  }
  return null;
}

export default async function DeliveryZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const zone = await getData(id);

  if (!zone) {
    notFound();
  }

  const nextDeliveryDay = getNextDeliveryDay(zone.deliveryDays);
  const shortDays = zone.deliveryDays.map(d => d.substring(0, 3));
  const isFreeDelivery = zone.deliveryFee === 0;

  // Coverage display logic
  const coverageZips = zone.zipCodes.slice(0, 5);
  const remainingZips = zone.zipCodes.length - 5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {/* Header section - blue gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Truck icon + zone name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">{zone.name}</h1>
          </div>

          {/* Description if available */}
          {zone.description && zone.description.trim() && (
            <p className="text-white/90 mb-4 text-sm">{zone.description}</p>
          )}

          {/* Delivery days as pills */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  shortDays.includes(day)
                    ? 'bg-white text-blue-700'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Next delivery day */}
          {nextDeliveryDay && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 inline-block mb-4">
              <p className="text-white/80 text-xs font-medium mb-1">Next delivery</p>
              <p className="text-white text-lg font-bold">{nextDeliveryDay}</p>
            </div>
          )}

          {/* Delivery fee info */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {isFreeDelivery ? (
              <span className="bg-green-400/90 text-white px-3 py-1 rounded-full text-sm font-bold">
                FREE DELIVERY
              </span>
            ) : (
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                ${(zone.deliveryFee / 100).toFixed(2)} delivery
              </span>
            )}
            {zone.freeDeliveryThreshold && (
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                Free over ${(zone.freeDeliveryThreshold / 100).toFixed(0)}
              </span>
            )}
            {zone.minimumOrder && (
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                Min ${(zone.minimumOrder / 100).toFixed(0)}
              </span>
            )}
          </div>

          {/* Coverage: zip codes */}
          {zone.zipCodes.length > 0 && (
            <div className="mb-4">
              <p className="text-white/80 text-xs font-medium mb-2">Delivery coverage</p>
              <div className="flex items-center gap-2 flex-wrap">
                {coverageZips.map((zip) => (
                  <span
                    key={zip}
                    className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded text-xs"
                  >
                    {zip}
                  </span>
                ))}
                {remainingZips > 0 && (
                  <span className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                    +{remainingZips} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cities coverage if available */}
          {zone.cities.length > 0 && (
            <div className="mb-4">
              <p className="text-white/80 text-xs font-medium mb-2">Cities</p>
              <div className="flex items-center gap-2 flex-wrap">
                {zone.cities.map((city) => (
                  <span
                    key={city}
                    className="bg-white/10 backdrop-blur-sm text-white px-2 py-1 rounded text-xs"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vendor info */}
          <div className="flex items-center gap-2">
            {zone.user.profileImage && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
                <Image
                  src={zone.user.profileImage}
                  alt={zone.user.firstName || 'Vendor'}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <p className="text-white/90 text-sm">
              by <span className="font-semibold">{zone.user.firstName || 'Vendor'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Available for Delivery</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span className="text-sm">{zone.products.length} products</span>
          </div>
        </div>

        {zone.products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products available for delivery in this zone yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {zone.products.map((product) => (
              <ProductHamburgerRow key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
