import { Card } from "@/components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { MarketStandForm } from "@/components/form/MarketStandForm";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewMarketStandPage() {
  noStore();
  
  try {
    const user = await getUser();

    if (!user) {
      redirect('/');
    }

    return (
      <div>
        <div className="mb-8">
          <Link href="/dashboard/market-stand/setup">
            <Button variant="ghost" className="gap-2 pl-0 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Market Stands
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Your Market Stand</h1>
          <p className="text-muted-foreground">
            Set up your market stand to start selling your products to local customers.
          </p>
        </div>

        <Card className="mb-8">
          <MarketStandForm 
            userId={user.id.toString()} 
          />
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in NewMarketStandPage:", error);
    
    return (
      <div>
        <div className="mb-8">
          <Link href="/dashboard/market-stand/setup">
            <Button variant="ghost" className="gap-2 pl-0 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Market Stands
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Error Loading Page</h1>
          <p className="text-muted-foreground">
            There was an error loading this page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
