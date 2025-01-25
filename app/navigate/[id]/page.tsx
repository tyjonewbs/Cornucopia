import prisma from "../../../lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { MapPin } from "lucide-react";
import MapViewClient from '../../../components/MapViewClient';
import Image from "next/image";

async function getData(id: string) {
  const marketStand = await prisma.marketStand.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      locationName: true,
      locationGuide: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          inventory: true,
        },
        where: {
          inventory: {
            gt: 0
          }
        },
        take: 3
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
        }
      }
    }
  });

  return marketStand;
}

export default async function NavigatePage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const marketStand = await getData(decodeURIComponent(params.id));

  if (!marketStand) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-2xl font-bold text-center">Market Stand not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Market Stand Details */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src={marketStand.user.profileImage}
                  alt={marketStand.user.firstName}
                  fill
                  className="rounded-full border-2 border-primary object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{marketStand.name}</h2>
                <p className="text-muted-foreground">
                  Managed by {marketStand.user.firstName} {marketStand.user.lastName}
                </p>
              </div>
            </div>

            {/* Description */}
            {marketStand.description && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {marketStand.description}
                </p>
              </div>
            )}

            {/* Location Details */}
            <div className="border-t pt-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">{marketStand.locationName}</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {marketStand.locationGuide}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Products */}
          {marketStand.products.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Available Products</h3>
              <div className="space-y-4">
                {marketStand.products.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.inventory} available
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(product.price / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4">GPS Coordinates</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Latitude</p>
                <p className="font-mono">{marketStand.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Longitude</p>
                <p className="font-mono">{marketStand.longitude.toFixed(6)}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${marketStand.latitude},${marketStand.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Google Maps
              </a>
              <a
                href={`https://maps.apple.com/?daddr=${marketStand.latitude},${marketStand.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Apple Maps
              </a>
            </div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="lg:h-[calc(100vh-12rem)] h-[400px] bg-white rounded-lg shadow-md overflow-hidden">
<MapViewClient
  latitude={marketStand.latitude}
  longitude={marketStand.longitude} 
  locationName={marketStand.locationName}
/>
        </div>
      </div>
    </div>
  );
}
