'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect('/');
}
