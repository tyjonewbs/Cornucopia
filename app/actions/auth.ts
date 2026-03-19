'use server'

import { getSupabaseServer } from '@/lib/supabase-server';
import { getAuthRedirectUrl } from '@/lib/supabase-config';
import jwt from 'jsonwebtoken';

// Env vars validated at runtime inside functions, not at module load

export async function signInWithEmail(email: string, password: string) {
  const supabase = await getSupabaseServer();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = await getSupabaseServer();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl('/dashboard'),
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
}

export async function getUser() {
  const supabase = await getSupabaseServer();
  // Use getUser() instead of getSession() for secure server-side auth
  // getUser() validates the token with Supabase Auth server
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return user;
}

export async function getSupabaseToken() {
  const user = await getUser();
  
  if (!user || !user.id) {
    throw new Error('Not authenticated');
  }

  // Create a JWT that Supabase will accept
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
    sub: user.id,
    email: user.email,
    role: 'authenticated'
  };

  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('Missing SUPABASE_JWT_SECRET');
  }
  const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET as jwt.Secret);
  return token;
}
