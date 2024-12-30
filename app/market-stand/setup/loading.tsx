import { Card } from "components/ui/card";
import { Skeleton } from "components/ui/skeleton";

export default function LoadingSetupPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 md:px-8 mb-14">
      <div className="mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <Card className="mb-8 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-6" />
        <Skeleton className="h-10 w-full" />
      </Card>

      <Card>
        <Skeleton className="h-[400px] w-full" />
      </Card>
    </section>
  );
}
