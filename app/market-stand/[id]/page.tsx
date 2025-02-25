import prisma from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { MapPin, Package, Clock, Navigation, Globe, Twitter, Instagram, Facebook, Youtube, Linkedin } from "lucide-react";
import { WeeklyHours, DAYS_OF_WEEK } from "@/types/hours";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { MarketStandHours } from "@/components/MarketStandHours";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import MapView from "@/components/MapView";
import { Separator } from "@/components/ui/separator";

async function getData(encodedId: string) {
  try {
    const id = decodeURIComponent(encodedId);

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
        tags: true,
        website: true,
        socialMedia: true,
        hours: true,
        products: {
          select: {
            id: true,
            name: true,
            images: true,
            updatedAt: true,
            price: true,
            inventory: true,
            tags: true,
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

    if (!marketStand) return null;

    // Serialize dates and validate hours format
    const hours = marketStand.hours as WeeklyHours | null;
    
    return {
      ...marketStand,
      createdAt: marketStand.createdAt.toISOString(),
      products: marketStand.products.map(product => ({
        ...product,
        updatedAt: product.updatedAt.toISOString()
      })),
      hours: hours && DAYS_OF_WEEK.every(day => 
        hours[day] && 
        typeof hours[day].isOpen === 'boolean' && 
        Array.isArray(hours[day].timeSlots)
      ) ? hours : null
    };
  } catch (err) {
    return null;
  }
}

export default async function MarketStandPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
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

          {/* Name and Tags */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{marketStand.name}</h1>
            {marketStand.tags && marketStand.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {marketStand.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-secondary px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
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
                  isQRAccess={false}
                  price={product.price}
                  tags={product.tags}
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

          {/* Hours Card */}
          {marketStand.hours && (
            <Card>
              <CardContent className="p-6">
                <MarketStandHours hours={marketStand.hours} />
              </CardContent>
            </Card>
          )}

          {/* Social Media Card */}
          {(marketStand.website || (marketStand.socialMedia && marketStand.socialMedia.length > 0)) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
                <div className="space-y-4">
                  {marketStand.website && (
                    <a 
                      href={marketStand.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-primary hover:underline"
                    >
                      <Globe className="h-5 w-5" />
                      <span>Visit our website</span>
                    </a>
                  )}
                  {marketStand.socialMedia && marketStand.socialMedia.map((link, index) => {
                    let icon = <Globe className="h-5 w-5" />;
                    let platform = "Social Media";
                    
                    if (link.includes("twitter.com")) {
                      icon = <Twitter className="h-5 w-5" />;
                      platform = "Twitter";
                    } else if (link.includes("instagram.com")) {
                      icon = <Instagram className="h-5 w-5" />;
                      platform = "Instagram";
                    } else if (link.includes("facebook.com")) {
                      icon = <Facebook className="h-5 w-5" />;
                      platform = "Facebook";
                    } else if (link.includes("youtube.com")) {
                      icon = <Youtube className="h-5 w-5" />;
                      platform = "YouTube";
                    } else if (link.includes("linkedin.com")) {
                      icon = <Linkedin className="h-5 w-5" />;
                      platform = "LinkedIn";
                    }

                    return (
                      <a 
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:underline"
                      >
                        {icon}
                        <span>{platform}</span>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
