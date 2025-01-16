import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const createServerSupabaseClient = () =>
  createServerComponentClient({
    cookies,
  });

export const getUser = async () => {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  // Serialize user data to handle any non-serializable objects
  return user ? JSON.parse(JSON.stringify(user)) : null;
};
