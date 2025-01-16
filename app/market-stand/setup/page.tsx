import { Card } from "../../../components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { MarketStandForm } from "../../../components/form/MarketStandForm";
import { AuthDialog } from "@/components/AuthDialog";
import { getUser } from "@/lib/auth";

export default async function MarketStandSetupPage() {
  noStore();
  const user = await getUser(); // User data is already serialized from getUser

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-14">
      <Card>
        {user ? (
          <MarketStandForm userId={user.id.toString()} />
        ) : (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Your Market Stand</h2>
            <p className="mb-6">Please sign in to create your market stand.</p>
            <AuthDialog />
          </div>
        )}
      </Card>
    </section>
  );
}
