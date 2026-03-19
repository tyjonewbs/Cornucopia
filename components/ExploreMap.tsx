'use client';

import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import Link from 'next/link';
import { Store, Wheat, Calendar, Truck, MapPin, Navigation, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { MapItem, MapItemType, ExploreMapData } from '@/app/actions/explore-map';

const libraries: Libraries = ['places', 'geometry'];

interface ExploreMapProps {
  data: ExploreMapData;
  userLocation?: { lat: number; lng: number } | null;
  isLoadingLocation?: boolean;
  locationError?: string | null;
  onRetryLocation?: () => void;
}

// Calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Convert km to miles
function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Map styling
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// SVG data URI marker icons with a white circle + crisp icon inside a colored pin
const createMarkerSvg = (type: MapItemType, isSelected: boolean): string => {
  const colors: Record<MapItemType, { fill: string; stroke: string }> = {
    'market-stand': { fill: '#10B981', stroke: '#059669' },
    'local': { fill: '#F59E0B', stroke: '#D97706' },
    'event': { fill: '#8B5CF6', stroke: '#7C3AED' },
    'delivery': { fill: '#F43F5E', stroke: '#E11D48' },
  };

  const { fill, stroke } = colors[type];

  // Icons drawn at center (24, 19) inside a white circle, using simple strokes
  // viewBox is 48x62 so we have plenty of resolution
  const iconPaths: Record<MapItemType, string> = {
    // Store: awning roof + building body
    'market-stand': `
      <path d="M16 16h16v2.5c0 1-0.8 1.8-1.8 1.8s-1.8-0.8-1.8-1.8h0c0 1-0.8 1.8-1.8 1.8s-1.8-0.8-1.8-1.8h0c0 1-0.8 1.8-1.8 1.8s-1.8-0.8-1.8-1.8h0c0 1-0.8 1.8-1.8 1.8s-1.8-0.8-1.8-1.8h0c0 1-0.8 1.8-1.8 1.8S16 19.5 16 18.5z" fill="${fill}" opacity="0.9"/>
      <rect x="17" y="21" width="14" height="7" rx="0.5" fill="none" stroke="${fill}" stroke-width="1.5"/>
      <rect x="21" y="23" width="6" height="5" rx="0.3" fill="${fill}" opacity="0.3"/>`,
    // Farm: leaf shape
    'local': `
      <path d="M24 13c-5 0-9 4-9 9c3 0 6-1 8-3c-1 2-1 4-1 6" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 13c5 0 9 4 9 9c-3 0-6-1-8-3" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // Event: calendar
    'event': `
      <rect x="17" y="15" width="14" height="12" rx="2" fill="none" stroke="${fill}" stroke-width="1.5"/>
      <line x1="17" y1="20" x2="31" y2="20" stroke="${fill}" stroke-width="1.5"/>
      <line x1="21" y1="13" x2="21" y2="17" stroke="${fill}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="27" y1="13" x2="27" y2="17" stroke="${fill}" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="21.5" cy="23.5" r="1" fill="${fill}"/>
      <circle cx="26.5" cy="23.5" r="1" fill="${fill}"/>`,
    // Delivery: truck
    'delivery': `
      <rect x="14" y="16" width="13" height="9" rx="1" fill="none" stroke="${fill}" stroke-width="1.5"/>
      <path d="M27 19h4l3 3.5V25h-7z" fill="none" stroke="${fill}" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="19" cy="26.5" r="2" fill="none" stroke="${fill}" stroke-width="1.3"/>
      <circle cx="31" cy="26.5" r="2" fill="none" stroke="${fill}" stroke-width="1.3"/>
      <line x1="21" y1="26.5" x2="29" y2="26.5" stroke="${fill}" stroke-width="1.3"/>`,
  };

  const w = isSelected ? 48 : 40;
  const h = isSelected ? 62 : 52;
  const scale = isSelected ? 1 : 0.833;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 48 62">
    <defs>
      <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
      </filter>
    </defs>
    <g transform="scale(${scale})" transform-origin="24 31" filter="url(#s)">
      <path d="M24 2C14.6 2 7 9.6 7 19c0 11.5 17 28 17 28s17-16.5 17-28C41 9.6 33.4 2 24 2z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <circle cx="24" cy="19" r="13" fill="white"/>
      ${iconPaths[type]}
    </g>
  </svg>`;

  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
};

const getMarkerIcon = (type: MapItemType, isSelected: boolean): google.maps.Icon => {
  const w = isSelected ? 48 : 40;
  const h = isSelected ? 62 : 52;
  return {
    url: createMarkerSvg(type, isSelected),
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h),
  };
};

// Type icon component
const TypeIcon = ({ type, className }: { type: MapItemType; className?: string }) => {
  switch (type) {
    case 'market-stand':
      return <Store className={cn("h-4 w-4", className)} />;
    case 'local':
      return <Wheat className={cn("h-4 w-4", className)} />;
    case 'event':
      return <Calendar className={cn("h-4 w-4", className)} />;
    case 'delivery':
      return <Truck className={cn("h-4 w-4", className)} />;
  }
};

// Type colors for badges
const typeColors: Record<MapItemType, string> = {
  'market-stand': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'local': 'bg-amber-100 text-amber-800 border-amber-200',
  'event': 'bg-violet-100 text-violet-800 border-violet-200',
  'delivery': 'bg-rose-100 text-rose-800 border-rose-200',
};

const typeLabels: Record<MapItemType, string> = {
  'market-stand': 'Market Stand',
  'local': 'Farm',
  'event': 'Event',
  'delivery': 'Delivery',
};

export default function ExploreMap({ 
  data, 
  userLocation, 
  isLoadingLocation,
  locationError,
  onRetryLocation 
}: ExploreMapProps) {
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MapItemType>>(
    () => new Set<MapItemType>(['market-stand', 'local', 'event', 'delivery'])
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries
  });

  // Combine all items and filter
  const allItems = useMemo(() => {
    const items = [
      ...data.marketStands,
      ...data.locals,
      ...data.events,
      ...data.deliveries,
    ];
    return items.filter(item => activeFilters.has(item.type));
  }, [data, activeFilters]);

  // Sort by distance if user location available
  const sortedItems = useMemo(() => {
    if (!userLocation) return allItems;
    return [...allItems].sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distA - distB;
    });
  }, [allItems, userLocation]);

  // Viewport-based filtering (for sidebar only)
  const viewportItems = useMemo(() => {
    if (!mapBounds) return sortedItems; // show all before map loads
    return sortedItems.filter(item => {
      return mapBounds.contains({ lat: item.latitude, lng: item.longitude });
    });
  }, [sortedItems, mapBounds]);

  // Default center (US center) or user location
  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (allItems.length > 0) {
      return { lat: allItems[0].latitude, lng: allItems[0].longitude };
    }
    return { lat: 39.8283, lng: -98.5795 }; // US center
  }, [userLocation, allItems]);

  const handleBoundsChanged = useCallback(() => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) setMapBounds(bounds);
    }
  }, [map]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    if (allItems.length === 0) return;

    if (userLocation) {
      // When we have user location, zoom in close to them
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);

      // Add some nearby items to the initial bounds
      const nearbyForBounds = allItems.slice(0, 10);
      nearbyForBounds.forEach(item => {
        bounds.extend({ lat: item.latitude, lng: item.longitude });
      });

      mapInstance.fitBounds(bounds, 50);
      // Ensure we don't zoom out too far
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        const zoom = mapInstance.getZoom();
        if (zoom && zoom < 10) {
          mapInstance.setZoom(10);
        }
      });
    } else {
      // No user location - fit all items
      const bounds = new google.maps.LatLngBounds();
      allItems.forEach(item => {
        bounds.extend({ lat: item.latitude, lng: item.longitude });
      });
      mapInstance.fitBounds(bounds, 50);
    }
  }, [allItems, userLocation]);

  const toggleFilter = (type: MapItemType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleMarkerClick = (item: MapItem) => {
    setSelectedItem(item);
    if (map) {
      map.panTo({ lat: item.latitude, lng: item.longitude });
    }
  };

  const centerOnUser = () => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(13);
    }
  };

  // Calculate counts for each type
  const counts = useMemo(() => ({
    'market-stand': data.marketStands.length,
    'local': data.locals.length,
    'event': data.events.length,
    'delivery': data.deliveries.length,
  }), [data]);

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Desktop Filter Pills - Fixed at top, hidden on mobile */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4 hidden md:block">
        <div className="flex gap-2">
          {(['market-stand', 'local', 'event', 'delivery'] as MapItemType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-md",
                activeFilters.has(type)
                  ? typeColors[type]
                  : "bg-white/90 text-gray-600 border border-gray-200"
              )}
            >
              <TypeIcon type={type} />
              <span>{typeLabels[type]}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs">
                {counts[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Filter/List Menu Button - Only on mobile, matches home page FAB style */}
      <div className="fixed bottom-28 left-4 z-40 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              size="lg"
              className="rounded-full shadow-lg bg-[#0B4D2C] hover:bg-[#0B4D2C]/90 h-14 w-14"
            >
              <Filter className="h-6 w-6" />
              <span className="sr-only">Open filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="bg-[#0B4D2C] p-4">
              <SheetTitle className="text-white">Explore Local</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col h-[calc(100%-70px)]">
              {/* Filters */}
              <div className="p-4 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Show on Map
                </p>
                <div className="space-y-2">
                  {(['market-stand', 'local', 'event', 'delivery'] as MapItemType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => toggleFilter(type)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        activeFilters.has(type)
                          ? typeColors[type]
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      <TypeIcon type={type} />
                      <span className="flex-grow text-left">{typeLabels[type]}</span>
                      <span className="bg-white/70 px-2 py-0.5 rounded-full text-xs">
                        {counts[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* List of places */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {viewportItems.length} Places in View
                  </p>
                </div>
                <div className="space-y-2">
                  {viewportItems.map(item => (
                    <SheetClose asChild key={`${item.type}-${item.id}`}>
                      <button
                        onClick={() => handleMarkerClick(item)}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                            item.type === 'market-stand' && "bg-emerald-100",
                            item.type === 'local' && "bg-amber-100",
                            item.type === 'event' && "bg-violet-100",
                            item.type === 'delivery' && "bg-rose-100",
                          )}>
                            <TypeIcon type={item.type} className={cn(
                              "h-5 w-5",
                              item.type === 'market-stand' && "text-emerald-600",
                              item.type === 'local' && "text-amber-600",
                              item.type === 'event' && "text-violet-600",
                              item.type === 'delivery' && "text-rose-600",
                            )} />
                          </div>
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="font-medium truncate text-sm">{item.name}</p>
                          {item.farmName && (
                            <p className="text-xs text-muted-foreground">at {item.farmName}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {item.locationName}
                          </p>
                          {userLocation && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                              {kmToMiles(calculateDistance(
                                userLocation.lat, 
                                userLocation.lng, 
                                item.latitude, 
                                item.longitude
                              )).toFixed(1)} mi away
                            </p>
                          )}
                          {item.eventDate && (
                            <p className="text-xs text-violet-700 font-medium mt-0.5">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {item.eventDate}
                            </p>
                          )}
                          {item.type === 'delivery' && item.nextDeliveryDate && (
                            <p className="text-xs text-rose-700 font-medium mt-0.5">
                              <Truck className="h-3 w-3 inline mr-1" />
                              Next: {new Date(item.nextDeliveryDate).toLocaleDateString()}
                            </p>
                          )}
                          {item.type === 'delivery' && item.deliveryCoverage && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Delivers to: {item.deliveryCoverage}
                            </p>
                          )}
                        </div>
                      </button>
                    </SheetClose>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onBoundsChanged={handleBoundsChanged}
        options={mapOptions}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: '#ffffff',
            }}
            zIndex={1000}
          />
        )}

        {/* Item markers */}
        {sortedItems.map(item => (
          <Marker
            key={`${item.type}-${item.id}`}
            position={{ lat: item.latitude, lng: item.longitude }}
            onClick={() => handleMarkerClick(item)}
            icon={getMarkerIcon(item.type, selectedItem?.id === item.id)}
            zIndex={selectedItem?.id === item.id ? 999 : 1}
          />
        ))}

        {/* Info Window for selected marker */}
        {selectedItem && (
          <InfoWindow
            position={{ lat: selectedItem.latitude, lng: selectedItem.longitude }}
            onCloseClick={() => setSelectedItem(null)}
          >
            <div className="p-2 min-w-[200px]">
              <Badge className={cn("text-xs mb-2", typeColors[selectedItem.type])}>
                <TypeIcon type={selectedItem.type} className="mr-1 h-3 w-3" />
                {typeLabels[selectedItem.type]}
              </Badge>
              <h3 className="font-semibold text-base mb-1">{selectedItem.name}</h3>
              {selectedItem.farmName && (
                <p className="text-sm text-gray-600 mb-1">at {selectedItem.farmName}</p>
              )}
              <p className="text-sm text-gray-600 mb-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                {selectedItem.locationName}
              </p>
              {selectedItem.eventDate && (
                <p className="text-sm text-violet-700 font-medium mb-2">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {selectedItem.eventDate}
                  {selectedItem.eventTime && ` at ${selectedItem.eventTime}`}
                </p>
              )}
              {selectedItem.type === 'delivery' && (
                <div className="text-sm space-y-1 mb-2">
                  {selectedItem.ownerName && (
                    <p className="text-gray-600 font-medium">From: {selectedItem.ownerName}</p>
                  )}
                  {selectedItem.deliveryCoverage && (
                    <p className="text-gray-600">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Delivers to: {selectedItem.deliveryCoverage}
                    </p>
                  )}
                  {selectedItem.deliveryDays && selectedItem.deliveryDays.length > 0 && (
                    <p className="text-gray-600">
                      Days: {selectedItem.deliveryDays.join(', ')}
                    </p>
                  )}
                  {selectedItem.deliveryFee !== undefined && (
                    <p className="text-rose-700 font-medium">
                      {selectedItem.deliveryFee === 0
                        ? 'Free delivery'
                        : `Delivery: $${(selectedItem.deliveryFee / 100).toFixed(2)}`}
                    </p>
                  )}
                  {selectedItem.nextDeliveryDate && (
                    <p className="text-rose-700 font-medium">
                      Next delivery: {new Date(selectedItem.nextDeliveryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              {userLocation && (
                <p className="text-sm text-primary font-medium mb-3">
                  {kmToMiles(calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    selectedItem.latitude, 
                    selectedItem.longitude
                  )).toFixed(1)} mi away
                </p>
              )}
              <Link href={selectedItem.href}>
                <Button size="sm" className="w-full">View Details</Button>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Center on user button */}
      {userLocation && (
        <button
          onClick={centerOnUser}
          className="absolute bottom-4 right-4 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
          title="Center on my location"
        >
          <Navigation className="h-5 w-5 text-blue-600" />
        </button>
      )}

      {/* Location error banner */}
      {locationError && (
        <div className="absolute top-4 left-20 right-4 md:left-4 md:top-20 z-10 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="flex-grow">{locationError}</span>
            {onRetryLocation && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetryLocation}
                disabled={isLoadingLocation}
                className="text-xs"
              >
                {isLoadingLocation ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block absolute top-20 right-4 bottom-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {viewportItems.length} Places in View
            </h3>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {viewportItems.map(item => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleMarkerClick(item)}
              className={cn(
                "w-full flex items-start gap-3 p-4 hover:bg-gray-50 text-left transition-colors border-b",
                selectedItem?.id === item.id && "bg-gray-50"
              )}
            >
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className={cn(
                  "w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0",
                  item.type === 'market-stand' && "bg-emerald-100",
                  item.type === 'local' && "bg-amber-100",
                  item.type === 'event' && "bg-violet-100",
                  item.type === 'delivery' && "bg-rose-100",
                )}>
                  <TypeIcon type={item.type} className={cn(
                    "h-6 w-6",
                    item.type === 'market-stand' && "text-emerald-600",
                    item.type === 'local' && "text-amber-600",
                    item.type === 'event' && "text-violet-600",
                    item.type === 'delivery' && "text-rose-600",
                  )} />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <Badge className={cn("text-xs mb-1", typeColors[item.type])}>
                  {typeLabels[item.type]}
                </Badge>
                <p className="font-medium truncate">{item.name}</p>
                {item.farmName && (
                  <p className="text-xs text-muted-foreground">at {item.farmName}</p>
                )}
                <p className="text-xs text-muted-foreground truncate mt-1">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {item.locationName}
                </p>
                {userLocation && (
                  <p className="text-sm text-primary font-medium mt-1">
                    {kmToMiles(calculateDistance(
                      userLocation.lat, 
                      userLocation.lng, 
                      item.latitude, 
                      item.longitude
                    )).toFixed(1)} mi away
                  </p>
                )}
                {item.eventDate && (
                  <p className="text-xs text-violet-700 font-medium mt-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {item.eventDate}
                  </p>
                )}
                {item.type === 'delivery' && item.nextDeliveryDate && (
                  <p className="text-xs text-rose-700 font-medium mt-1">
                    <Truck className="h-3 w-3 inline mr-1" />
                    Next: {new Date(item.nextDeliveryDate).toLocaleDateString()}
                  </p>
                )}
                {item.type === 'delivery' && item.deliveryCoverage && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    Delivers to: {item.deliveryCoverage}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state removed — obvious from empty map */}
    </div>
  );
}
