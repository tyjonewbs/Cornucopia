import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return redirect('/');
  }

  return redirect("/dashboard/market-stand");
}
