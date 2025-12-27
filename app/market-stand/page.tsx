import { Suspense } from 'react';
import { getExploreMapData } from '@/app/actions/explore-map';
import ExploreMapClient from './explore-map-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingMap() {
  return (
    <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading explore map...</p>
      </div>
    </div>
  );
}

export default async function ExplorePage() {
  const mapData = await getExploreMapData();
  
  return (
    <Suspense fallback={<LoadingMap />}>
      <ExploreMapClient initialData={mapData} />
    </Suspense>
  );
}
