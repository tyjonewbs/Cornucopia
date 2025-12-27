'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Heart, MessageSquare, Bell } from 'lucide-react';

interface MyLocalHaulClientProps {
  initialData: any; // Will type properly once Prisma client is regenerated
}

export function MyLocalHaulClient({ initialData }: MyLocalHaulClientProps) {
  const [activeTab, setActiveTab] = useState('orders');

  const {
    orders = [],
    savedProducts = [],
    productReviews = [],
    standReviews = [],
    subscriptions = [],
  } = initialData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Track your purchases, saved items, reviews, and market stand subscriptions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
            <span className="sm:hidden">Orders</span>
            {orders.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {orders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Saved</span>
            <span className="sm:hidden">Saved</span>
            {savedProducts.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {savedProducts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
            <span className="sm:hidden">Reviews</span>
            {(productReviews.length + standReviews.length) > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {productReviews.length + standReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Subscriptions</span>
            <span className="sm:hidden">Subs</span>
            {subscriptions.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {subscriptions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                View and track all your orders from market stands
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Your purchase history will appear here
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Products</CardTitle>
              <CardDescription>
                Your wishlist of products from local market stands
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved products</h3>
                  <p className="text-muted-foreground">
                    Save products to your wishlist to view them here
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {savedProducts.length} product{savedProducts.length !== 1 ? 's' : ''} saved
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Reviews</CardTitle>
              <CardDescription>
                Reviews you've written for products and market stands
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productReviews.length === 0 && standReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">
                    Share your experience by writing reviews
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {productReviews.length} product review{productReviews.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {standReviews.length} stand review{standReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Stand Subscriptions</CardTitle>
              <CardDescription>
                Manage notifications from your favorite market stands
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No subscriptions</h3>
                  <p className="text-muted-foreground">
                    Subscribe to market stands to get updates
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Subscribed to {subscriptions.length} market stand{subscriptions.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
