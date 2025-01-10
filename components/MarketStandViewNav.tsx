import { MapPin, Grid } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

interface MarketStandViewNavProps {
  currentView: 'grid' | 'map';
}

export function MarketStandViewNav({ currentView }: MarketStandViewNavProps) {
  return (
    <div className="flex gap-4">
      <Link href="/market-stand/grid">
        <Button variant={currentView === 'grid' ? 'default' : 'outline'}>
          <Grid className="h-4 w-4 mr-2" />
          Grid View
        </Button>
      </Link>
      <Link href="/market-stand/map">
        <Button variant={currentView === 'map' ? 'default' : 'outline'}>
          <MapPin className="h-4 w-4 mr-2" />
          Map View
        </Button>
      </Link>
    </div>
  );
}
