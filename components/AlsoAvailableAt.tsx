import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

interface MarketStandLocation {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

interface AlsoAvailableAtProps {
  stands: MarketStandLocation[];
  productName: string;
}

export function AlsoAvailableAt({ stands, productName }: AlsoAvailableAtProps) {
  if (stands.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Also Available At</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This product is also available at {stands.length} other {stands.length === 1 ? 'location' : 'locations'}
      </p>
      <div className="space-y-3">
        {stands.map((stand) => (
          <Link
            key={stand.id}
            href={`/market-stand/${stand.id}`}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border"
          >
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {stand.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{stand.locationName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stand.latitude.toFixed(4)}, {stand.longitude.toFixed(4)}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 italic">
        Visit each market stand to check current availability and hours
      </p>
    </div>
  );
}
