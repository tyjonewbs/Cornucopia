'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { env } from './env';  // Import env directly

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseBrowser() {
  try {
    if (!clientInstance) {
      clientInstance = createClientComponentClient();

      // Initialize auth state - no automatic reload to prevent loops
      clientInstance.auth.onAuthStateChange((event, session) => {
        // Let SupabaseProvider handle auth state changes
        // This prevents the reload loop issue
      });
    }
    return clientInstance;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Create a fallback client with default values if env variables are missing
    return createClientComponentClient({
      supabaseUrl: env.SUPABASE_URL || 'https://fzlelklnibjzpgrquzrq.supabase.co',
      supabaseKey: env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bGVsa2xuaWJqenBncnF1enJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTYwNjcsImV4cCI6MjA1MDYzMjA2N30.TEaKFsDU7JJwmX70KTRX740oH43wEDQjn1tguG0n7_o'
    });
  }
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
