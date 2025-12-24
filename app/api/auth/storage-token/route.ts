import { createServerSupabaseClient } from "@/lib/auth";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use getUser() for secure server-side auth validation
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // User is already validated via getUser() above

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
