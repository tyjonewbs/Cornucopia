'use server'

import { getUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/auth';

export async function uploadImageWithAuth(
  fileBase64: string,
  filename: string,
  bucket: string = 'products',
  path: string = ''
): Promise<string> {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required for image upload');
  }

  const supabase = createServerSupabaseClient();
  const fileName = `${path}${Date.now()}-${filename}`;
  
  // Convert base64 to buffer
  const base64Data = fileBase64.split(',')[1] || fileBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(`${user.id}/${fileName}`, buffer, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = await supabase.storage
    .from(bucket)
    .getPublicUrl(`${user.id}/${data.path}`);

  if (!urlData.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return urlData.publicUrl;
}

export async function uploadImagesWithAuth(
  files: { base64: string; name: string }[],
  bucket: string = 'products',
  path?: string
): Promise<string[]> {
  const uploadPromises = files.map(file => 
    uploadImageWithAuth(file.base64, file.name, bucket, path)
  );
  return Promise.all(uploadPromises);
}
