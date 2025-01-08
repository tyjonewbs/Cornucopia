import { Skeleton } from "../../../components/ui/skeleton";
import { Button } from "../../../components/ui/button";
import { MapIcon, List } from "lucide-react";
import Link from "next/link";

export default function MarketStandsMapLoading() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Market Stands</h1>
          <p className="text-muted-foreground mt-2">
            Discover local market stands near you
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/market-stand">
            <Button variant="outline" size="sm">
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </Link>
          <Button variant="default" size="sm" disabled>
            <MapIcon className="h-4 w-4 mr-2" />
            Map View
          </Button>
        </div>
      </div>

      <Skeleton className="w-full h-[600px] rounded-lg" />
    </section>
  );
}
