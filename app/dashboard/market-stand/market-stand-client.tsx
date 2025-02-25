"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MarketStandCard } from "@/components/MarketStandCard";
import { MarketStandSelector } from "@/components/dashboard/MarketStandSelector";
import { ProductList } from "@/components/dashboard/ProductList";
import { useState, useEffect } from "react";

interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  locationName: string;
  locationGuide: string;
  latitude: number;
  longitude: number;
  images: string[];
  tags: string[];
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  updatedAt: Date;
}

interface MarketStandDashboardClientProps {
  initialMarketStands: MarketStand[];
}

export function MarketStandDashboardClient({ initialMarketStands }: MarketStandDashboardClientProps) {
  const [marketStands] = useState<MarketStand[]>(initialMarketStands);
  const [selectedStandId, setSelectedStandId] = useState<string>(initialMarketStands[0]?.id || "");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedStandId) return;

      try {
        const response = await fetch(`/api/market-stand/${selectedStandId}/products`);
        const data = await response.json();
        const transformedData = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          quantity: product.inventory,
          updatedAt: new Date(product.updatedAt)
        }));
        setProducts(transformedData);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    if (selectedStandId) {
      fetchProducts();
    }
  }, [selectedStandId]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    try {
      // Optimistic update
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, quantity: newQuantity }
          : product
      ));

      // Update on server
      await fetch(`/api/product/${productId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert on error
      const response = await fetch(`/api/market-stand/${selectedStandId}/products`);
      const data = await response.json();
      setProducts(data);
    }
  };

  const selectedStand = marketStands.find(stand => stand.id === selectedStandId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Market Stand Management</h1>
          <p className="text-muted-foreground">
            Manage your market stands and their products
          </p>
        </div>
        <Link href="/dashboard/market-stand/setup">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Market Stand
          </Button>
        </Link>
      </div>

      {marketStands.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No market stands yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first market stand to start selling products
          </p>
          <Link href="/dashboard/market-stand/setup">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Market Stand
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <MarketStandSelector
            marketStands={marketStands}
            selectedId={selectedStandId}
            onSelect={setSelectedStandId}
          />

          {selectedStand && (
            <div className="grid gap-6">
              <MarketStandCard 
                stand={selectedStand}
              />
              <ProductList
                products={products}
                onQuantityChange={handleQuantityChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
