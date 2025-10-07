'use client';

import { createBrowserClient } from '@supabase/ssr';

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create client with default options
    clientInstance = createBrowserClient(supabaseUrl, supabaseKey);

    // Initialize auth state - no automatic reload to prevent loops
    clientInstance.auth.onAuthStateChange(() => {
      // Let SupabaseProvider handle auth state changes
      // This prevents the reload loop issue
    });
  }
  return clientInstance;
}

// Helper function for uploading images
export async function uploadImage(
  file: File,
  bucket: string = 'products',
  path: string = ''
): Promise<string> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required for image upload');
    }

    // Include user ID in the path to prevent conflicts
    const fileName = `${session.user.id}/${path}${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = await supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
     throw error;
  }
}

// Helper function for deleting images
export async function deleteImage(
  url: string,
  bucket: string = 'products'
): Promise<void> {
  const supabase = getSupabaseBrowser();
  
  // Extract file path from URL
  const path = url.split(`${bucket}/`)[1];
  if (!path) throw new Error('Invalid image URL');

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
}

// Helper function for uploading multiple images
export async function uploadImages(
  files: File[],
  bucket: string = 'products',
  path: string = ''
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(file, bucket, path));
    const results = await Promise.allSettled(uploadPromises);
    
    // Filter out rejected promises and return successful uploads
    const successfulUploads = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
    
    // Log errors for failed uploads
    results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .forEach(result => {
        console.error('Image upload failed:', result.reason);
      });
    
    if (successfulUploads.length === 0 && files.length > 0) {
      throw new Error('All image uploads failed');
    }
    
    return successfulUploads;
  } catch (error) {
    console.error('Error in uploadImages:', error);
    throw error;
  }
}
