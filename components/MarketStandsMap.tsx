interface MarketStand {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

interface MarketStandsMapProps {
  marketStands: MarketStand[];
}

export default function MarketStandsMap({ marketStands }: MarketStandsMapProps) {
  if (marketStands.length === 0) {
    return (
      <div className="w-full h-[600px] rounded-lg border flex items-center justify-center">
        No market stands available
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS || '';
  // Use the first market stand's location name
  const searchQuery = encodeURIComponent(marketStands[0].locationName);
  const mapUrl = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${searchQuery}&zoom=15`;

  return (
    <iframe
      width="100%"
      height="600"
      style={{ border: 0, borderRadius: '0.5rem' }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={mapUrl}
      title="Market Stands Map"
    />
  );
}
