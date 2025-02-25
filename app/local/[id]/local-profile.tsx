'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import MapView from '@/components/MapView';
import { ProductGrid } from '@/components/ProductGrid';
import { getLocalProducts, type SerializedProduct } from '@/app/actions/local-products';
import type { Local } from '@prisma/client';

interface LocalProfileProps {
  local: Local;
  isOwner?: boolean;
}

export default function LocalProfile({ local, isOwner = false }: LocalProfileProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [products, setProducts] = useState<SerializedProduct[]>([]);

  useEffect(() => {
    if (activeTab === 'products') {
      getLocalProducts(local.id)
        .then(fetchedProducts => setProducts(fetchedProducts))
        .catch(console.error);
    }
  }, [activeTab, local.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full mb-8">
        {isOwner && (
          <Link
            href={`/local/${local.id}/edit`}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-black px-4 py-2 rounded-md shadow-md transition-colors"
          >
            Edit Profile
          </Link>
        )}
        <Carousel className="w-full h-full">
          <CarouselContent>
            {local.images.map((image, index) => (
              <CarouselItem key={index}>
                <img 
                  src={image} 
                  alt={`${local.name} image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-4xl font-bold text-white mb-2">{local.name}</h1>
          <p className="text-white/90">{local.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {/* Farm Story */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">About Us</h2>
            <p className="text-gray-700">{local.story || local.description}</p>
          </Card>

          {/* Farming Practices */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Farming Practices</h2>
            <p className="text-gray-700">{local.farmingPractices}</p>
          </Card>

          {/* Team Members */}
          {local.teamMembers && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Meet the Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(local.teamMembers as Record<string, any>).map(([name, role]) => (
                  <div key={name} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-gray-600">{role}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {local.certifications && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Certifications & Awards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(local.certifications as Record<string, any>).map(([cert, details]) => (
                  <div key={cert} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{cert}</h3>
                    <p className="text-gray-600">{details}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Seasonal Updates */}
          {local.seasonalSchedule && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Seasonal Updates</h2>
              <div className="space-y-4">
                {Object.entries(local.seasonalSchedule as Record<string, any>).map(([season, details]) => (
                  <div key={season} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{season}</h3>
                    <p className="text-gray-600">{details}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Products</h2>
            <ProductGrid 
              initialProducts={products} 
              userLocation={null}
            />
          </Card>
        </TabsContent>

        <TabsContent value="events">
          {local.events && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {Object.entries(local.events as Record<string, any>).map(([event, details]) => (
                  <div key={event} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{event}</h3>
                    <p className="text-gray-600">{details}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              {local.operatingHours && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Hours of Operation</h3>
                  <div className="space-y-2">
                    {Object.entries(local.operatingHours as Record<string, any>).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium">{day}</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {local.wholesaleInfo && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Wholesale Inquiries</h3>
                  <p className="text-gray-700">{local.wholesaleInfo}</p>
                </div>
              )}

              {local.contactForm && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Contact Form</h3>
                  {/* Add contact form implementation here */}
                </div>
              )}
            </Card>

            {/* Map */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Location</h2>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <MapView
                  latitude={local.latitude}
                  longitude={local.longitude}
                  locationName={local.name}
                />
              </div>
              <p className="mt-4 text-gray-700">{local.locationGuide}</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
