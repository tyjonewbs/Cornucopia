import { DeliveryZoneForm } from "@/components/form/DeliveryZoneForm";
import { getSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function NewDeliveryZonePage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DeliveryZoneForm />
    </div>
  );
}
