import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { env } from './env';  // Import env directly

// Singleton instance for server-side
export const getSupabaseServer = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient({ 
    cookies: () => cookieStore,
  });
});
