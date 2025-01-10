import prisma from "../../../lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { MapPin, Package, Edit, Clock, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { ProductCard } from "../../../components/ProductCard";
import { Card, CardContent } from "../../../components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../../../components/ui/carousel";
import MapView from "../../../components/MapView";
import { Separator } from "../../../components/ui/separator";

async function getData(encodedId: string) {
  try {
    const id = decodeURIComponent(encodedId);
    await prisma.$queryRaw`SELECT 1`;

    const marketStand = await prisma.marketStand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        locationName: true,
        locationGuide: true,
        latitude: true,
        longitude: true,
        userId: true,
        createdAt: true,
        products: {
          select: {
            id: true,
            name: true,
            images: true,
            updatedAt: true,
            price: true,
            inventory: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          }
        }
      }
    });

    return marketStand;
  } catch (error) {
    console.error('getData error:', error);
    return null;
  }
}

export default async function MarketStandPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const marketStand = await getData(params.id);

  if (!marketStand) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-2xl font-bold text-center">Market Stand not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{marketStand.name}</h1>
          </div>
        </div>
        {user?.id === marketStand.userId && (
          <Link href={`/market-stand/${params.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Stand
            </Button>
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Carousel */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {marketStand.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${marketStand.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About this Market Stand</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {marketStand.description}
              </p>
            </CardContent>
          </Card>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available Products</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{marketStand.products.length} products</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {marketStand.products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  images={product.images}
                  locationName={marketStand.locationName}
                  updatedAt={product.updatedAt}
                  inventory={product.inventory}
                  marketStandId={marketStand.id}
                  isQRAccess={false}
                  price={product.price}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{marketStand.locationName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {marketStand.locationGuide}
                    </p>
                  </div>
                </div>
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <MapView 
                    latitude={marketStand.latitude} 
                    longitude={marketStand.longitude}
                    locationName={marketStand.locationName}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">
                      {new Date(marketStand.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="font-medium">
                      {marketStand.latitude.toFixed(6)}, {marketStand.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
