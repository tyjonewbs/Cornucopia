import { createServerSupabaseClient } from "@/lib/auth";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Create a scoped token that only allows uploads to the user's directory
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new NextResponse("Session error", { status: 401 });
    }

    // Get storage bucket policy
    const { data, error } = await supabase.storage
      .from('products')
      .createSignedUrl(`${user.id}/upload-policy`, 60); // 60 seconds expiry

    if (error) {
      return new NextResponse("Failed to create upload policy", { status: 500 });
    }

    return NextResponse.json({
      url: data.signedUrl,
      path: `${user.id}/upload-policy`
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
