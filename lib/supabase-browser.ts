'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseBrowser() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient();
  }
  return clientInstance;
}

// Helper function for uploading images
export async function uploadImage(
  file: File,
  bucket: string = 'images',
  path: string = ''
): Promise<string> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required for image upload');
    }

    const fileName = `${path}${Date.now()}-${file.name}`;

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
  bucket: string = 'images'
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
  bucket: string = 'images',
  path: string = ''
): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file, bucket, path));
  return Promise.all(uploadPromises);
}
