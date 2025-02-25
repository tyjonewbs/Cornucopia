import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }

  // Redirect to market-stand dashboard by default
  redirect('/dashboard/market-stand');
}
