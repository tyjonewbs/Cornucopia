'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, List } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { ProductCard } from "../../../components/ProductCard";

// Dynamic import for MapView to handle SSR
const MapView = dynamic(
  () => import('../../../components/MapView'),
  {
    ssr: false,
    loading: () => <div className="h-[600px] animate-pulse bg-gray-200 rounded-lg" />
  }
);

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  latitude: number | null;
  longitude: number | null;
}

interface ClientWrapperProps {
  products: Product[];
}

export function ClientWrapper({ products }: ClientWrapperProps) {
  const [currentView, setCurrentView] = useState<'map' | 'grid'>('grid');
  const [sortOrder, setSortOrder] = useState<'price' | 'name'>('name');

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortOrder) {
      case 'price':
        return a.price - b.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* View Toggle and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={currentView === 'grid' ? 'default' : 'outline'}
            onClick={() => setCurrentView('grid')}
          >
            <List className="h-4 w-4 mr-2" />
            Grid View
          </Button>
          <Button
            variant={currentView === 'map' ? 'default' : 'outline'}
            onClick={() => setCurrentView('map')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>
        {currentView === 'grid' && (
          <Select
            value={sortOrder}
            onValueChange={(value: 'price' | 'name') => setSortOrder(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current View */}
      {currentView === 'map' ? (
        <MapView products={products} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-10 mt-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              description={product.description}
              images={product.images}
              latitude={product.latitude}
              longitude={product.longitude}
            />
          ))}
        </div>
      )}
    </div>
  );
}
