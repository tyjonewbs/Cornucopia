import { Calendar, Truck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, startOfDay } from "date-fns";

interface AvailabilityDatesListProps {
  deliveryDates?: Date[];
  availableDate?: Date | null;
  availableUntil?: Date | null;
  deliveryAvailable: boolean;
  hasPickup: boolean;
  maxDisplay?: number;
}

export function AvailabilityDatesList({
  deliveryDates,
  availableDate,
  availableUntil,
  deliveryAvailable,
  hasPickup,
  maxDisplay = 10,
}: AvailabilityDatesListProps) {
  const today = startOfDay(new Date());

  // Case 1: Specific delivery dates
  if (deliveryDates && deliveryDates.length > 0) {
    const futureDates = deliveryDates
      .filter(date => isAfter(date, today) || date.getTime() === today.getTime())
      .sort((a, b) => a.getTime() - b.getTime())
      .slice(0, maxDisplay);

    if (futureDates.length === 0) {
      return (
        <div className="bg-muted rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Availability</h3>
              <p className="text-sm text-muted-foreground">
                No upcoming delivery dates scheduled
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-muted rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Available Delivery Dates</h3>
            <p className="text-sm text-muted-foreground">
              Select a date for delivery or pickup
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {futureDates.map((date) => (
            <div
              key={date.toISOString()}
              className="flex items-center justify-between py-3 px-4 bg-background rounded-md border hover:border-primary transition-colors"
            >
              <div>
                <p className="font-medium">
                  {format(date, "EEEE, MMM d")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(date, "yyyy")}
                </p>
              </div>
              <div className="flex gap-2">
                {deliveryAvailable && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Delivery
                  </Badge>
                )}
                {hasPickup && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    Pickup
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {deliveryDates.length > maxDisplay && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            +{deliveryDates.length - maxDisplay} more dates available
          </p>
        )}
      </div>
    );
  }

  // Case 2: Date range (seasonal)
  if (availableDate && availableUntil) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Seasonal Availability</h3>
            <p className="text-base mb-3">
              Available from{" "}
              <span className="font-semibold">{format(availableDate, "MMM d")}</span>
              {" "}to{" "}
              <span className="font-semibold">{format(availableUntil, "MMM d, yyyy")}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {deliveryAvailable && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Delivery Available
                </Badge>
              )}
              {hasPickup && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Pickup Available
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Always available (pickup only)
  if (hasPickup && !deliveryAvailable) {
    return (
      <div className="bg-muted rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Store className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Availability</h3>
            <p className="text-base text-muted-foreground">
              Available for pickup during market stand hours
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Don't show anything if no availability info
  return null;
}
