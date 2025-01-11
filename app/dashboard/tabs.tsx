"use client";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { PaymentTab } from "../../components/PaymentTab";

interface DashboardProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  createdAt: Date;
}

interface DashboardMarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  products: DashboardProduct[];
  user: {
    firstName: string;
    profileImage: string;
    stripeConnectedLinked: boolean;
  };
}

interface DashboardTabsProps {
  marketStand: DashboardMarketStand | null;
  products: DashboardProduct[];
}

export function DashboardTabs({ marketStand, products }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="market-stand" className="space-y-4">
      <TabsList>
        <TabsTrigger value="market-stand">Market Stand</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="payment">Payment</TabsTrigger>
      </TabsList>

      <TabsContent value="market-stand" className="space-y-4">
        {marketStand ? (
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-4">{marketStand.name}</h2>
                <p className="text-muted-foreground mb-6">{marketStand.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm mb-1">Location</h3>
                    <p className="text-muted-foreground">{marketStand.locationName}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-1">How to Find Us</h3>
                    <p className="text-muted-foreground">{marketStand.locationGuide}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm mb-1">Coordinates</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{marketStand.latitude.toFixed(6)}, {marketStand.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link href={`/market-stand/${marketStand.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Market Stand
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">No Market Stand</h2>
            <p className="text-muted-foreground">You haven&apos;t set up your market stand yet.</p>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="products" className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Products</h2>
          <Link href="/sell">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
        {products.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground">You haven&apos;t added any products yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    <p className="text-sm font-medium mt-2">
                      {(product.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                  </div>
                  <Link href={`/product/${product.id}/edit`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="payment" className="space-y-4">
        <PaymentTab 
          marketStand={marketStand} 
          stripeConnected={marketStand?.user.stripeConnectedLinked || false}
        />
      </TabsContent>
    </Tabs>
  );
}
