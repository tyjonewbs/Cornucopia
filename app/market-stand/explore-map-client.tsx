'use client';

import ExploreMap from '@/components/ExploreMap';
import useUserLocation from '@/app/hooks/useUserLocation';
import type { ExploreMapData } from '@/app/actions/explore-map';

interface ExploreMapClientProps {
  initialData: ExploreMapData;
}

export default function ExploreMapClient({ initialData }: ExploreMapClientProps) {
  const { userLocation, locationError, isLoadingLocation, retryLocation } = useUserLocation();

  return (
    <div className="fixed inset-0 top-16 md:top-0 md:relative md:h-[calc(100vh-64px)] w-full overflow-hidden">
      <ExploreMap
        data={initialData}
        userLocation={userLocation ? { lat: userLocation.coords.lat, lng: userLocation.coords.lng } : null}
        isLoadingLocation={isLoadingLocation}
        locationError={locationError}
        onRetryLocation={retryLocation}
      />
    </div>
  );
}
