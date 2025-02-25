import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function SellRoute() {
  const user = await getUser();

  if (!user) {
    return redirect('/');
  }

  return redirect('/dashboard/sell');
}
