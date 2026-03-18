import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";

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
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Also Available At</h3>
        <p className="text-sm text-muted-foreground">
          You can find {productName} at {stands.length} other {stands.length === 1 ? 'location' : 'locations'}
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
        {stands.map((stand) => (
          <div key={stand.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
            {/* Map pin icon */}
            <div className="w-10 h-10 rounded-lg bg-[#0B4D2C]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-[#0B4D2C]" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/market-stand/${stand.id}`}
                className="font-semibold text-sm text-gray-900 hover:text-[#0B4D2C] transition-colors truncate block"
              >
                {stand.name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{stand.locationName}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/market-stand/${stand.id}`}
                className="text-xs font-medium text-[#0B4D2C] border border-[#0B4D2C]/30 rounded-full px-3 py-1 hover:bg-[#0B4D2C]/5 transition-colors"
              >
                View
              </Link>
              {stand.latitude && stand.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${stand.latitude},${stand.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  Go
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
