'use client';

import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import Link from 'next/link';
import { Store, Wheat, Calendar, MapPin, Navigation, Menu, Filter } from 'lucide-react';
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

// Marker icons by type
const getMarkerIcon = (type: MapItemType, isSelected: boolean): google.maps.Symbol => {
  const colors = {
    'market-stand': { fill: '#10B981', stroke: '#059669' }, // emerald
    'local': { fill: '#F59E0B', stroke: '#D97706' }, // amber
    'event': { fill: '#8B5CF6', stroke: '#7C3AED' }, // violet
  };
  
  const { fill, stroke } = colors[type];
  const scale = isSelected ? 1.3 : 1;
  
  return {
    path: 'M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0ZM12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5C13.66 5.5 15 6.84 15 8.5C15 10.16 13.66 11.5 12 11.5Z',
    fillColor: fill,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: stroke,
    scale: scale,
    anchor: new google.maps.Point(12, 24),
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
  }
};

// Type colors for badges
const typeColors: Record<MapItemType, string> = {
  'market-stand': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'local': 'bg-amber-100 text-amber-800 border-amber-200',
  'event': 'bg-violet-100 text-violet-800 border-violet-200',
};

const typeLabels: Record<MapItemType, string> = {
  'market-stand': 'Market Stand',
  'local': 'Farm',
  'event': 'Event',
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
    () => new Set<MapItemType>(['market-stand', 'local', 'event'])
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || '';
  
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

  // Default center (US center) or user location
  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (allItems.length > 0) {
      return { lat: allItems[0].latitude, lng: allItems[0].longitude };
    }
    return { lat: 39.8283, lng: -98.5795 }; // US center
  }, [userLocation, allItems]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    if (allItems.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    allItems.forEach(item => {
      bounds.extend({ lat: item.latitude, lng: item.longitude });
    });
    if (userLocation) {
      bounds.extend(userLocation);
    }
    mapInstance.fitBounds(bounds, 50);
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
          {(['market-stand', 'local', 'event'] as MapItemType[]).map(type => (
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

      {/* Mobile Filter/List Menu Button - Only on mobile */}
      <div className="absolute top-4 left-4 z-10 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              size="icon"
              className="bg-white shadow-lg hover:bg-gray-50 text-gray-700"
            >
              <Filter className="h-5 w-5" />
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
                  {(['market-stand', 'local', 'event'] as MapItemType[]).map(type => (
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {sortedItems.length} Places Nearby
                </p>
                <div className="space-y-2">
                  {sortedItems.map(item => (
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
                          )}>
                            <TypeIcon type={item.type} className={cn(
                              "h-5 w-5",
                              item.type === 'market-stand' && "text-emerald-600",
                              item.type === 'local' && "text-amber-600",
                              item.type === 'event' && "text-violet-600",
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
          <h3 className="font-semibold">{sortedItems.length} places nearby</h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {sortedItems.map(item => (
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
                )}>
                  <TypeIcon type={item.type} className={cn(
                    "h-6 w-6",
                    item.type === 'market-stand' && "text-emerald-600",
                    item.type === 'local' && "text-amber-600",
                    item.type === 'event' && "text-violet-600",
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
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg text-center z-10">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No places found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or check back later for new listings.
          </p>
        </div>
      )}
    </div>
  );
}
