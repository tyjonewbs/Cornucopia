import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function MarketStandSetupLoading() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-14">
      <Card>
        <Skeleton className="h-[800px]" />
      </Card>
    </section>
  );
}
