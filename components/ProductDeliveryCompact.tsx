'use client';

import { Truck, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  minimumOrder: number | null;
  freeDeliveryThreshold: number | null;
  zipCodes: string[];
  cities: string[];
  states: string[];
  deliveryDays: string[];
}

interface ProductDeliveryCompactProps {
  deliveryZone: DeliveryZone;
}

export function ProductDeliveryCompact({ deliveryZone }: ProductDeliveryCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInZone, setIsInZone] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<{ zipCode?: string; city?: string; state?: string } | null>(null);

  useEffect(() => {
    // Try to get user location from localStorage (if they've used zip search banner)
    const storedZip = localStorage.getItem('userZipCode');
    const storedCity = localStorage.getItem('userCity');
    const storedState = localStorage.getItem('userState');

    if (storedZip || storedCity || storedState) {
      const location = {
        zipCode: storedZip || undefined,
        city: storedCity || undefined,
        state: storedState || undefined,
      };
      setUserLocation(location);

      // Check if user is in delivery zone
      const inZone = checkIfInZone(location);
      setIsInZone(inZone);
    }
  }, []);

  const checkIfInZone = (location: { zipCode?: string; city?: string; state?: string }): boolean => {
    // Check ZIP code first (most specific)
    if (location.zipCode && deliveryZone.zipCodes.includes(location.zipCode)) {
      return true;
    }

    // Check city
    if (location.city && deliveryZone.cities.some(c => c.toLowerCase() === location.city?.toLowerCase())) {
      return true;
    }

    // Check state
    if (location.state && deliveryZone.states.some(s => s.toLowerCase() === location.state?.toLowerCase())) {
      return true;
    }

    return false;
  };

  const hasFreeThreshold = deliveryZone.freeDeliveryThreshold && deliveryZone.freeDeliveryThreshold > 0;
  const hasMinimumOrder = deliveryZone.minimumOrder && deliveryZone.minimumOrder > 0;

  // Compact view when user is in zone
  if (isInZone) {
    return (
      <div className="bg-green-50 rounded-lg border border-green-200 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <Truck className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">✓ Delivery Available</p>
              <p className="text-sm text-green-700 mt-0.5">
                {deliveryZone.deliveryFee === 0 
                  ? 'Free Delivery' 
                  : `$${(deliveryZone.deliveryFee / 100).toFixed(2)} delivery fee`
                }
                {hasFreeThreshold && deliveryZone.freeDeliveryThreshold && (
                  <span className="block text-xs mt-1">
                    Free over ${(deliveryZone.freeDeliveryThreshold / 100).toFixed(0)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-700 hover:text-green-900 transition-colors p-1"
            aria-label="Toggle details"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-green-200 space-y-3 text-sm">
            {hasMinimumOrder && deliveryZone.minimumOrder && (
              <p className="text-gray-700">
                <span className="font-medium">Minimum Order:</span> ${(deliveryZone.minimumOrder / 100).toFixed(2)}
              </p>
            )}
            {deliveryZone.deliveryDays && deliveryZone.deliveryDays.length > 0 && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Delivery Days:</p>
                <div className="flex flex-wrap gap-1.5">
                  {deliveryZone.deliveryDays.map((day) => (
                    <span
                      key={day}
                      className="px-2 py-0.5 bg-white border border-green-300 rounded text-xs text-green-800"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Condensed view when user is NOT in zone or location unknown
  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Truck className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Delivery to Select Areas</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {deliveryZone.states.length > 0 && `Available in ${deliveryZone.states.join(', ')}`}
              {deliveryZone.cities.length > 0 && deliveryZone.cities.length <= 3 && ` - ${deliveryZone.cities.join(', ')}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900 transition-colors p-1"
          aria-label="Toggle details"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-900">Delivery Fee:</p>
            <p className="text-gray-700">
              {deliveryZone.deliveryFee === 0 
                ? 'Free' 
                : `$${(deliveryZone.deliveryFee / 100).toFixed(2)}`
              }
              {hasFreeThreshold && deliveryZone.freeDeliveryThreshold && (
                <span className="text-xs ml-1">
                  (Free over ${(deliveryZone.freeDeliveryThreshold / 100).toFixed(0)})
                </span>
              )}
            </p>
          </div>

          {hasMinimumOrder && deliveryZone.minimumOrder && (
            <p className="text-gray-700">
              <span className="font-medium">Minimum Order:</span> ${(deliveryZone.minimumOrder / 100).toFixed(2)}
            </p>
          )}

          <div>
            <p className="font-medium text-gray-900 mb-1">Coverage:</p>
            {deliveryZone.cities.length > 0 && (
              <p className="text-gray-700 text-xs">
                Cities: {deliveryZone.cities.slice(0, 5).join(", ")}
                {deliveryZone.cities.length > 5 && ` +${deliveryZone.cities.length - 5} more`}
              </p>
            )}
            {deliveryZone.zipCodes.length > 0 && (
              <p className="text-gray-700 text-xs mt-1">
                {deliveryZone.zipCodes.length} ZIP codes serviced
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
