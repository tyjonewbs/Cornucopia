'use client';

import dynamic from "next/dynamic";

import { MapViewProps } from './MapView';

const MapView = dynamic<MapViewProps>(
  () => import('./MapView'),
  {
    ssr: false,
    loading: () => <div className="h-[400px] animate-pulse bg-gray-200 rounded-lg" />
  }
);

type MapViewClientProps = MapViewProps;

export default function MapViewClient({ latitude, longitude, locationName }: MapViewClientProps) {
  return <MapView latitude={latitude} longitude={longitude} locationName={locationName} />;
}
