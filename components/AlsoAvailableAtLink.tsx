import { MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

interface AlsoAvailableAtLinkProps {
  stands: Array<{
    id: string;
    name: string;
    locationName: string;
  }>;
  productName: string;
}

export function AlsoAvailableAtLink({ stands, productName }: AlsoAvailableAtLinkProps) {
  if (stands.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Also Available At Other Stands
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            This product is available at {stands.length} other {stands.length === 1 ? 'location' : 'locations'}
          </p>
          {stands.slice(0, 2).map((stand) => (
            <Link
              key={stand.id}
              href={`/market-stand/${stand.id}`}
              className="block text-sm text-primary hover:underline mb-1"
            >
              • {stand.name}
            </Link>
          ))}
          {stands.length > 2 && (
            <p className="text-xs text-gray-500 mt-2">
              + {stands.length - 2} more {stands.length > 3 ? 'locations' : 'location'}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
