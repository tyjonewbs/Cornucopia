import { LocalForm } from "@/components/form/LocalForm";
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
      <h1 className="text-3xl font-bold mb-8">Create Your Farm/Ranch Profile</h1>
      <LocalForm onSubmit={createLocal} />
    </div>
  );
}
