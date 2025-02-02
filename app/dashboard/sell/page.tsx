export const dynamic = 'force-dynamic';

import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellClient from "./sell-client";

export default async function SellPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }

  return <SellClient />;
}
