import { createServerSupabaseClient } from "@/lib/auth";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// Disable body parsing, as we'll handle raw body ourselves for file uploads
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to user's folder with proper permissions
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let uploadResult = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half',
        upsert: false
      });

    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error);
      if (uploadResult.error.message.includes('row-level security')) {
        // Set up bucket policy if it doesn't exist
        await supabase.storage.from('products').upload(`${user.id}/.keep`, new Uint8Array(0), {
          upsert: true
        });
        
        // Try upload again
        uploadResult = await supabase.storage
          .from('products')
          .upload(fileName, buffer, {
            contentType: file.type,
            duplex: 'half',
            upsert: false
          });
          
        if (uploadResult.error) {
          return new NextResponse(uploadResult.error.message, { status: 500 });
        }
      } else {
        return new NextResponse(uploadResult.error.message, { status: 500 });
      }
    }

    if (!uploadResult.data) {
      return new NextResponse("Failed to upload file", { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(uploadResult.data.path);

    if (!urlData?.publicUrl) {
      return new NextResponse("Failed to get public URL", { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error", 
      { status: 500 }
    );
  }
}
