import { FarmBuilderWizard } from "@/components/farm-builder/FarmBuilderWizard";
import { createLocal } from "@/app/actions/locals";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SetupLocalPage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Your Farm Page</h1>
        <p className="text-muted-foreground">Tell your story and connect with customers</p>
      </div>
      <FarmBuilderWizard onSubmit={createLocal} />
    </div>
  );
}
