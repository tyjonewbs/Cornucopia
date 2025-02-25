import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketStandSetupLoading() {
  return (
    <div>
      <Card>
        <Skeleton className="h-[800px]" />
      </Card>
    </div>
  );
}
