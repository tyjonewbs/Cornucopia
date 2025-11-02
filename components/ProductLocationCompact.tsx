'use client';

import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProductLocationCompactProps {
  standName: string;
  locationName: string;
  standId: string;
  alsoAvailableAt?: Array<{
    id: string;
    name: string;
    locationName: string;
  }>;
}

export function ProductLocationCompact({
  standName,
  locationName,
  standId,
  alsoAvailableAt = [],
}: ProductLocationCompactProps) {
  return (
    <div className="space-y-4">
      {/* Primary Location */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{standName}</p>
            <p className="text-sm text-gray-600 mt-0.5">{locationName}</p>
          </div>
        </div>
        <Link
          href={`/navigate/${standId}`}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <MapPin className="h-4 w-4" />
          Get Directions
        </Link>
      </div>

      {/* Also Available At - Condensed */}
      {alsoAvailableAt.length > 0 && (
        <div className="bg-gray-50 rounded-lg border p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Also Available At:</p>
          <div className="space-y-1.5">
            {alsoAvailableAt.slice(0, 2).map((stand) => (
              <Link
                key={stand.id}
                href={`/market-stand/${stand.id}`}
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary transition-colors group"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{stand.name}</span>
              </Link>
            ))}
            {alsoAvailableAt.length > 2 && (
              <p className="text-xs text-gray-500 italic">
                + {alsoAvailableAt.length - 2} more location{alsoAvailableAt.length > 3 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
