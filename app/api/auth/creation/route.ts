import prisma from "@/lib/db";
import { getSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request: Request) {
  noStore();
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  const user = session.user;

  let dbUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) {
    // Create user without Stripe integration for now
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        firstName: user.user_metadata?.name?.split(' ')[0] ?? "",
        lastName: user.user_metadata?.name?.split(' ')[1] ?? "",
        email: user.email ?? "",
        profileImage:
          user.user_metadata?.avatar_url ?? `https://avatar.vercel.sh/${user.user_metadata?.name?.split(' ')[0]}`,
        connectedAccountId: null,
        stripeConnectedLinked: false,
      },
    });
  }

  // Use the NEXT_PUBLIC_APP_URL from env or fallback to request origin
  const response = NextResponse.redirect(
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  );


  return response;
}
