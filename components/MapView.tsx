export interface MapViewProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function MapView({ latitude, longitude, locationName }: MapViewProps) {
  // Validate coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
      isNaN(latitude) || isNaN(longitude)) {
    console.error('Invalid coordinates:', { latitude, longitude });
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        Invalid coordinates
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || '';
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=14`;

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ minHeight: '200px', border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={mapUrl}
      title={`Map showing location of ${locationName}`}
    />
  );
}
