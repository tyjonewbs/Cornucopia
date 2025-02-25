'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import MapView from '@/components/MapView';
import { ProductGrid } from '@/components/ProductGrid';
import { getMarketStandProducts, type SerializedProduct } from '@/app/actions/market-stand-products';
import type { MarketStand } from '@prisma/client';

interface FarmProfileProps {
  marketStand: MarketStand;
}

export default function FarmProfile({ marketStand }: FarmProfileProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [products, setProducts] = useState<SerializedProduct[]>([]);

  useEffect(() => {
    if (activeTab === 'products') {
      getMarketStandProducts(marketStand.id)
        .then(fetchedProducts => setProducts(fetchedProducts))
        .catch(console.error);
    }
  }, [activeTab, marketStand.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full mb-8">
        <Carousel className="w-full h-full">
          <CarouselContent>
            {marketStand.images.map((image, index) => (
              <CarouselItem key={index}>
                <img 
                  src={image} 
                  alt={`${marketStand.name} image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-4xl font-bold text-white mb-2">{marketStand.name}</h1>
          <p className="text-white/90">{marketStand.description}</p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">About this Farm Stand</h2>
            <p className="text-gray-700">{marketStand.description}</p>
          </Card>

          {/* Tags */}
          {marketStand.tags && marketStand.tags.length > 0 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {marketStand.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-secondary px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
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

        <TabsContent value="location">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Location</h2>
            <div className="h-[400px] rounded-lg overflow-hidden mb-4">
              <MapView
                latitude={marketStand.latitude}
                longitude={marketStand.longitude}
                locationName={marketStand.name}
              />
            </div>
            <p className="text-gray-700">{marketStand.locationGuide}</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
