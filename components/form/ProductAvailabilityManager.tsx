"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import Link from "next/link";

interface MarketStand {
  id: string;
  name: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  deliveryDays: string[];
}

interface StandListing {
  marketStandId: string;
  inventory: number;
}

interface DeliveryListing {
  deliveryZoneId: string;
  dayOfWeek: string;
  inventory: number;
}

interface ProductAvailabilityManagerProps {
  marketStands: MarketStand[];
  deliveryZones: DeliveryZone[];
  standListings: StandListing[];
  deliveryListings: DeliveryListing[];
  onStandListingsChange: (listings: StandListing[]) => void;
  onDeliveryListingsChange: (listings: DeliveryListing[]) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ProductAvailabilityManager({
  marketStands,
  deliveryZones,
  standListings,
  deliveryListings,
  onStandListingsChange,
  onDeliveryListingsChange,
}: ProductAvailabilityManagerProps) {
  
  const getStandInventory = (marketStandId: string): number => {
    return standListings.find(l => l.marketStandId === marketStandId)?.inventory || 0;
  };

  const updateStandInventory = (marketStandId: string, inventory: number) => {
    const existing = standListings.find(l => l.marketStandId === marketStandId);
    if (existing) {
      onStandListingsChange(
        standListings.map(l => 
          l.marketStandId === marketStandId ? { ...l, inventory } : l
        )
      );
    } else {
      onStandListingsChange([...standListings, { marketStandId, inventory }]);
    }
  };

  const getDeliveryInventory = (deliveryZoneId: string, dayOfWeek: string): number => {
    return deliveryListings.find(
      l => l.deliveryZoneId === deliveryZoneId && l.dayOfWeek === dayOfWeek
    )?.inventory || 0;
  };

  const updateDeliveryInventory = (deliveryZoneId: string, dayOfWeek: string, inventory: number) => {
    const existing = deliveryListings.find(
      l => l.deliveryZoneId === deliveryZoneId && l.dayOfWeek === dayOfWeek
    );
    
    if (existing) {
      onDeliveryListingsChange(
        deliveryListings.map(l =>
          l.deliveryZoneId === deliveryZoneId && l.dayOfWeek === dayOfWeek
            ? { ...l, inventory }
            : l
        )
      );
    } else {
      onDeliveryListingsChange([
        ...deliveryListings,
        { deliveryZoneId, dayOfWeek, inventory }
      ]);
    }
  };

  // Group delivery zones by day
  const deliveryByDay = DAYS.map(day => {
    const zonesForDay = deliveryZones.filter(zone => 
      zone.deliveryDays && Array.isArray(zone.deliveryDays) && zone.deliveryDays.includes(day)
    );
    return { day, zones: zonesForDay };
  }).filter(item => item.zones.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-semibold">📦 Where is this product available?</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Set inventory for each market stand and delivery option
        </p>
      </div>

      {/* Market Stands Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Market Stands</h3>
          {marketStands.length === 0 && (
            <Link 
              href="/dashboard/market-stand/setup/new"
              className="text-sm text-primary hover:underline"
            >
              Create market stand →
            </Link>
          )}
        </div>

        {marketStands.length > 0 ? (
          <div className="space-y-2">
            {marketStands.map(stand => {
              const inventory = getStandInventory(stand.id);
              return (
                <div 
                  key={stand.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    inventory > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏪</span>
                      <span className="font-medium">{stand.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateStandInventory(stand.id, Math.max(0, inventory - 1))}
                        disabled={inventory === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{inventory}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateStandInventory(stand.id, inventory + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No market stands yet. Products can be listed at a market stand for customer pickup.
            </p>
          </div>
        )}
      </div>

      {/* Delivery Schedule Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Delivery Schedule</h3>
          {deliveryZones.length === 0 && (
            <Link 
              href="/dashboard/delivery-zones/new"
              className="text-sm text-primary hover:underline"
            >
              Create delivery zone →
            </Link>
          )}
        </div>

        {deliveryByDay.length > 0 ? (
          <div className="space-y-3">
            {deliveryByDay.map(({ day, zones }) => (
              <div key={day} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  {day}
                </div>
                <div className="divide-y">
                  {zones.map(zone => {
                    const inventory = getDeliveryInventory(zone.id, day);
                    return (
                      <div 
                        key={`${day}-${zone.id}`}
                        className={`p-4 transition-colors ${
                          inventory > 0 ? 'bg-blue-50/30' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔷</span>
                            <span className="text-sm font-medium">{zone.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateDeliveryInventory(zone.id, day, Math.max(0, inventory - 1))}
                              disabled={inventory === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center text-sm font-medium">{inventory}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateDeliveryInventory(zone.id, day, inventory + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No delivery zones yet. Products can be delivered to customers on scheduled days.
            </p>
          </div>
        )}
      </div>

      {marketStands.length === 0 && deliveryZones.length === 0 && (
        <div className="p-6 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-900 mb-2">
            ⚠️ No fulfillment options configured
          </p>
          <p className="text-sm text-yellow-700">
            Create a market stand or delivery zone to make this product available to customers.
            You can add these later from your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
