'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Store, Truck, MapPin, Navigation, ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import { DeliveryOptionsCard } from '@/components/DeliveryOptionsCard';
import { ProductLocationMap } from '@/components/ProductLocationMap';
import { MarketStandHours } from '@/components/MarketStandHours';
import { QRPaymentCallout } from '@/components/QRPaymentCallout';
import { formatDistanceToNow } from 'date-fns';
import { getCachedZipCode, setCachedZipCode } from '@/lib/utils/location-cache';
import { geocodeZipCode } from '@/app/actions/geocode';
import { checkDeliveryEligibility } from '@/app/actions/check-delivery-eligibility';
import { calculateDistance, kmToMiles } from '@/lib/utils/distance';

interface WhereToGetItProps {
  data: {
    id: string;
    name: string;
    marketStand?: {
      id: string;
      name: string;
      locationName: string;
      latitude?: number;
      longitude?: number;
      hours?: any;
      streetAddress?: string;
      city?: string;
      zipCode?: string;
    };
    inventory?: number;
    inventoryUpdatedAt?: Date;
    updatedAt?: Date;
    deliveryAvailable?: boolean;
    deliveryZone?: {
      name: string;
      deliveryFee: number;
      freeDeliveryThreshold?: number | null;
      minimumOrder?: number | null;
      zipCodes: string[];
      cities: string[];
      states: string[];
      deliveryDays: string[];
    } | null;
    deliveryListings?: Array<{
      inventory?: number;
    }>;
    standListings?: Array<{
      marketStand: {
        id: string;
        name: string;
        locationName: string;
        latitude?: number;
        longitude?: number;
        streetAddress?: string;
        city?: string;
        zipCode?: string;
        hours?: any;
      };
    }>;
    user?: {
      connectedAccountId?: string;
    };
  };
}

interface PickupLocation {
  id: string;
  name: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  hours?: any;
  streetAddress?: string;
  city?: string;
  zipCode?: string;
  distance?: number | null;
  isPrimary?: boolean;
  inventory?: number;
}

export function WhereToGetIt({ data }: WhereToGetItProps) {
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
  const [showPickupMap, setShowPickupMap] = useState(false);

  // Zip code state
  const [zipCode, setZipCode] = useState<string>('');
  const [zipInput, setZipInput] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingZip, setIsLoadingZip] = useState(false);

  // Delivery eligibility state
  const [deliveryEligible, setDeliveryEligible] = useState<boolean | null>(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);

  // Load cached zip code on mount
  useEffect(() => {
    const cached = getCachedZipCode();
    if (cached) {
      setZipCode(cached);
      setZipInput(cached);
      // Geocode the cached zip
      geocodeZipCode(cached).then((result) => {
        if (result) {
          setUserCoords({ lat: result.lat, lng: result.lng });
        }
      });
    }
  }, []);

  // Check delivery eligibility when zip changes
  useEffect(() => {
    if (zipCode && data.deliveryAvailable && data.deliveryZone) {
      setIsCheckingDelivery(true);
      checkDeliveryEligibility({
        productId: data.id,
        userZipCode: zipCode,
      })
        .then((result) => {
          setDeliveryEligible(result.isEligible);
        })
        .catch(() => {
          setDeliveryEligible(null);
        })
        .finally(() => {
          setIsCheckingDelivery(false);
        });
    } else {
      setDeliveryEligible(null);
    }
  }, [zipCode, data.deliveryAvailable, data.deliveryZone, data.id]);

  // Handle zip code update
  const handleUpdateZip = async () => {
    const cleanZip = zipInput.trim();
    if (!cleanZip || cleanZip === zipCode) return;

    setIsLoadingZip(true);
    try {
      const result = await geocodeZipCode(cleanZip);
      if (result) {
        setZipCode(cleanZip);
        setUserCoords({ lat: result.lat, lng: result.lng });
        setCachedZipCode(cleanZip, result);
      } else {
        // Invalid zip, but still update the input
        setZipCode(cleanZip);
        setUserCoords(null);
        setCachedZipCode(cleanZip);
      }
    } catch (error) {
      console.error('Error geocoding zip:', error);
    } finally {
      setIsLoadingZip(false);
    }
  };

  // Calculate pickup locations with distances
  const pickupLocations = useMemo<PickupLocation[]>(() => {
    const locations: PickupLocation[] = [];

    // Add primary market stand
    if (data.marketStand) {
      const distance = userCoords && data.marketStand.latitude && data.marketStand.longitude
        ? calculateDistance(
            userCoords.lat,
            userCoords.lng,
            data.marketStand.latitude,
            data.marketStand.longitude
          )
        : null;

      locations.push({
        id: data.marketStand.id,
        name: data.marketStand.name,
        locationName: data.marketStand.locationName,
        latitude: data.marketStand.latitude,
        longitude: data.marketStand.longitude,
        hours: data.marketStand.hours,
        streetAddress: data.marketStand.streetAddress,
        city: data.marketStand.city,
        zipCode: data.marketStand.zipCode,
        distance,
        isPrimary: true,
        inventory: data.inventory,
      });
    }

    // Add other stands
    if (data.standListings) {
      for (const listing of data.standListings) {
        // Skip if this is the same as the primary stand (avoid duplicate)
        if (data.marketStand && listing.marketStand.id === data.marketStand.id) continue;

        const distance = userCoords && listing.marketStand.latitude && listing.marketStand.longitude
          ? calculateDistance(
              userCoords.lat,
              userCoords.lng,
              listing.marketStand.latitude,
              listing.marketStand.longitude
            )
          : null;

        locations.push({
          id: listing.marketStand.id,
          name: listing.marketStand.name,
          locationName: listing.marketStand.locationName,
          latitude: listing.marketStand.latitude,
          longitude: listing.marketStand.longitude,
          hours: listing.marketStand.hours,
          streetAddress: listing.marketStand.streetAddress,
          city: listing.marketStand.city,
          zipCode: listing.marketStand.zipCode,
          distance,
          isPrimary: false,
        });
      }
    }

    // Sort by distance if available
    if (userCoords) {
      locations.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null || a.distance === undefined) return 1;
        if (b.distance === null || b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return locations;
  }, [data, userCoords]);

  // Calculate total options count
  const hasDelivery = data.deliveryAvailable && data.deliveryZone;
  const totalOptions = pickupLocations.length + (hasDelivery ? 1 : 0);

  // Get last updated time
  const getLastUpdated = () => {
    if (data.inventoryUpdatedAt) {
      return formatDistanceToNow(new Date(data.inventoryUpdatedAt), { addSuffix: true });
    }
    if (data.updatedAt) {
      return formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true });
    }
    return null;
  };

  const lastUpdated = getLastUpdated();

  // Get delivery inventory
  const deliveryInventory = data.deliveryListings?.reduce((sum, listing) => sum + (listing.inventory || 0), 0) || 0;

  // Get next delivery days from zone
  const nextDeliveryDays = data.deliveryZone?.deliveryDays?.slice(0, 2).join(', ') || 'Check availability';

  return (
    <section id="location-section" className="scroll-mt-20 space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold">Where to get it</h3>
        {totalOptions > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            {totalOptions} {totalOptions === 1 ? 'option' : 'options'}
          </span>
        )}
      </div>

      {/* Zip Code Bar */}
      {totalOptions > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateZip();
              }}
              onBlur={handleUpdateZip}
              placeholder="Enter zip code"
              maxLength={5}
              className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4D2C] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
            />
            <button
              onClick={handleUpdateZip}
              disabled={isLoadingZip || !zipInput.trim() || zipInput.trim() === zipCode}
              className="flex-shrink-0 text-xs font-medium text-white bg-[#0B4D2C] rounded-full px-3 py-1 hover:bg-[#0B4D2C]/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isLoadingZip ? '...' : 'Go'}
            </button>
          </div>
          {zipCode && (
            <p className="text-xs text-gray-600 mt-2 ml-7">
              Showing options near {zipCode}
            </p>
          )}
        </div>
      )}

      {/* Rows Container */}
      <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
        {/* Pickup Rows */}
        {pickupLocations.map((location) => {
          const distanceMiles = location.distance ? kmToMiles(location.distance) : null;
          const isFar = distanceMiles !== null && distanceMiles > 30;
          const isNearby = distanceMiles !== null && distanceMiles < 5;
          const isModerate = distanceMiles !== null && distanceMiles >= 5 && distanceMiles < 15;
          const showMap = showPickupMap && location.isPrimary;

          return (
            <div
              key={location.id}
              className={`bg-white ${isFar ? 'opacity-50 bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[#0B4D2C]/10 flex items-center justify-center flex-shrink-0">
                  {location.isPrimary ? (
                    <Store className="h-5 w-5 text-[#0B4D2C]" />
                  ) : (
                    <MapPin className="h-5 w-5 text-[#0B4D2C]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/market-stand/${location.id}`}
                      className="font-semibold text-sm text-gray-900 hover:text-[#0B4D2C] transition-colors"
                    >
                      {location.name}
                    </Link>
                    {distanceMiles !== null && (
                      <>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isNearby
                              ? 'bg-green-100 text-green-700'
                              : isModerate
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {distanceMiles.toFixed(1)} mi
                        </span>
                        {isNearby && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Nearby
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{location.locationName}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {location.isPrimary && location.inventory !== undefined && (
                      <span className="text-xs text-gray-600">
                        {location.inventory} in stock
                      </span>
                    )}
                    {location.isPrimary && lastUpdated && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated {lastUpdated}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {location.isPrimary ? (
                    <button
                      onClick={() => setShowPickupMap(!showPickupMap)}
                      className="text-xs font-medium text-[#0B4D2C] border border-[#0B4D2C]/30 rounded-full px-3 py-1 hover:bg-[#0B4D2C]/5 transition-colors"
                    >
                      {showPickupMap ? 'Hide Map' : 'View'}
                    </button>
                  ) : (
                    <Link
                      href={`/market-stand/${location.id}`}
                      className="text-xs font-medium text-[#0B4D2C] border border-[#0B4D2C]/30 rounded-full px-3 py-1 hover:bg-[#0B4D2C]/5 transition-colors"
                    >
                      View
                    </Link>
                  )}
                  {location.latitude && location.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <Navigation className="h-3 w-3" />
                      {location.isPrimary ? 'Directions' : 'Go'}
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded Pickup Details (for primary location only) */}
              {showMap && location.isPrimary && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-4">
                  {location.latitude && location.longitude && (
                    <ProductLocationMap
                      standId={location.id}
                      standName={location.name}
                      latitude={location.latitude}
                      longitude={location.longitude}
                      locationName={location.locationName}
                    />
                  )}

                  <div className="space-y-2">
                    <p className="font-semibold text-sm">{location.locationName}</p>
                    {location.streetAddress && (
                      <p className="text-sm text-muted-foreground">{location.streetAddress}</p>
                    )}
                    {(location.city || location.zipCode) && (
                      <p className="text-sm text-muted-foreground">
                        {[location.city, location.zipCode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  {location.hours && (
                    <div className="pt-2">
                      <MarketStandHours hours={location.hours} />
                    </div>
                  )}

                  {data.user?.connectedAccountId && (
                    <div className="pt-2">
                      <QRPaymentCallout standName={location.name} standId={location.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Delivery Row */}
        {hasDelivery && (
          <div className={`${deliveryEligible === false && zipCode ? 'bg-gray-50 opacity-50' : 'bg-green-50'}`}>
            <button
              onClick={() => setDeliveryExpanded(!deliveryExpanded)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                deliveryEligible === false && zipCode ? 'hover:bg-gray-100' : 'hover:bg-green-100'
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                deliveryEligible === false && zipCode ? 'bg-gray-700/10' : 'bg-green-700/10'
              }`}>
                <Truck className={`h-5 w-5 ${
                  deliveryEligible === false && zipCode ? 'text-gray-700' : 'text-green-700'
                }`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900">
                    {data.deliveryZone?.name || 'Home Delivery'}
                  </p>
                  {zipCode && deliveryEligible === true && !isCheckingDelivery && (
                    <>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Eligible
                      </span>
                    </>
                  )}
                  {zipCode && deliveryEligible === false && !isCheckingDelivery && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                      Not in zone
                    </span>
                  )}
                  {!zipCode && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Check availability
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Next delivery: {nextDeliveryDays}</p>
                {deliveryInventory > 0 && (
                  <span className={`text-xs font-medium ${
                    deliveryEligible === false && zipCode ? 'text-gray-600' : 'text-green-700'
                  }`}>
                    {deliveryInventory} available for delivery
                  </span>
                )}
              </div>

              {/* Chevron */}
              <div className="flex-shrink-0">
                {deliveryExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Expanded Delivery Options */}
            {deliveryExpanded && (
              <div className="px-4 py-4 bg-white border-t border-green-100">
                {data.deliveryZone ? (
                  <DeliveryOptionsCard
                    productId={data.id}
                    productName={data.name}
                  />
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          Delivery is marked as available but not properly configured.
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Please use pickup option or contact the seller.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* No options state */}
      {totalOptions === 0 && (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No purchase options available at this time.
          </p>
        </div>
      )}
    </section>
  );
}
