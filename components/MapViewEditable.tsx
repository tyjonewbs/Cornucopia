"use client";

export interface MapViewEditableProps {
  latitude: number;
  longitude: number;
  locationName: string;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapViewEditable({ 
  latitude, 
  longitude, 
  locationName,
  onLocationChange 
}: MapViewEditableProps) {
  // Validate coordinates
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
      isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center">
        Invalid coordinates
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || '';
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=14&maptype=roadmap&draggable=true`;

  // Handle message from the iframe when location is changed
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'location_change') {
      onLocationChange(event.data.latitude, event.data.longitude);
    }
  };

  // Add message listener
  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
  }

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
