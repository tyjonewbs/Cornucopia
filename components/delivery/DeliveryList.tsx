"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryCalendarPicker } from "./DeliveryCalendarPicker";
import { createDelivery, generateDeliveriesForZone } from "@/app/actions/deliveries";
import type { DeliveryZone, DeliveryInfo } from "@/types/delivery";
import { Truck, Plus, RefreshCw } from "lucide-react";
import { parseISO, startOfDay } from "date-fns";
import { toast } from "sonner";

interface DeliveryListProps {
  deliveries: DeliveryInfo[];
  zone: DeliveryZone;
  userProducts: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  }>;
}

export function DeliveryList({ deliveries, zone, userProducts }: DeliveryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const existingDates = deliveries.map(d => startOfDay(parseISO(d.date)));

  const handleCreateDeliveries = () => {
    if (selectedDates.length === 0) return;

    startTransition(async () => {
      let created = 0;
      let errors = 0;

      for (const date of selectedDates) {
        const result = await createDelivery({
          date,
          zoneIds: [zone.id],
        });
        if (result.success) created++;
        else errors++;
      }

      if (created > 0) {
        toast.success(`Created ${created} delivery${created > 1 ? " trips" : " trip"}`);
      }
      if (errors > 0) {
        toast.error(`${errors} date${errors > 1 ? "s" : ""} already had deliveries`);
      }

      setSelectedDates([]);
      setShowPicker(false);
      router.refresh();
    });
  };

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateDeliveriesForZone(zone.id);
      if (result.success) {
        toast.success(result.message || "Deliveries generated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate deliveries");
      }
    });
  };

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Upcoming Deliveries
            </CardTitle>
            <CardDescription>
              Manage delivery trips for {zone.name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {zone.deliveryType === 'RECURRING' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isPending ? "animate-spin" : ""}`} />
                Generate 8 Weeks
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowPicker(!showPicker)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Delivery
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Calendar picker for creating new deliveries */}
        {showPicker && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
            <p className="text-sm font-medium">
              Select dates to create new delivery trips:
            </p>
            <DeliveryCalendarPicker
              selectedDates={selectedDates}
              onDatesChange={setSelectedDates}
              existingDeliveryDates={existingDates}
              mode="multiple"
            />
            {selectedDates.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateDeliveries}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : `Create ${selectedDates.length} Delivery${selectedDates.length > 1 ? " Trips" : " Trip"}`}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDates([]);
                    setShowPicker(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Delivery cards */}
        {deliveries.length > 0 ? (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                userProducts={userProducts}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <h3 className="font-medium mb-1">No upcoming deliveries</h3>
            <p className="text-sm">
              {zone.deliveryType === 'RECURRING'
                ? 'Click "Generate 8 Weeks" to create deliveries from your schedule, or create individual trips.'
                : 'Click "Create Delivery" to add a delivery trip.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
