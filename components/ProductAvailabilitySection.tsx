import Link from "next/link";
import { MapPin, Clock, ExternalLink, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketStandHours } from "@/components/MarketStandHours";

interface MarketStand {
  id: string;
  name: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  hours?: any;
  streetAddress?: string;
  city?: string;
  zipCode?: string;
}

interface ProductAvailabilitySectionProps {
  stands: MarketStand[];
  productName: string;
}

export function ProductAvailabilitySection({ stands, productName }: ProductAvailabilitySectionProps) {
  if (stands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Also Available At</h3>
        <p className="text-sm text-muted-foreground">
          You can find {productName} at {stands.length} other {stands.length === 1 ? 'location' : 'locations'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stands.map((stand) => (
          <Card key={stand.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Stand Name and Location */}
                <div>
                  <Link 
                    href={`/market-stand/${stand.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors"
                  >
                    {stand.name}
                  </Link>
                  <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{stand.locationName}</p>
                      {stand.streetAddress && (
                        <p className="text-xs">{stand.streetAddress}</p>
                      )}
                      {(stand.city || stand.zipCode) && (
                        <p className="text-xs">
                          {[stand.city, stand.zipCode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hours */}
                {stand.hours && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-1 mb-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Hours</span>
                    </div>
                    <div className="text-sm">
                      <MarketStandHours hours={stand.hours} />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/market-stand/${stand.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Stand
                    </Button>
                  </Link>
                  {stand.latitude && stand.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Navigation className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
