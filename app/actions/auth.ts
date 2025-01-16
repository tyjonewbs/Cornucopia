'use server'

import { getSupabaseServer } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_JWT_SECRET) {
  throw new Error('Missing env.SUPABASE_JWT_SECRET');
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseServer();
  
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
  const supabase = getSupabaseServer();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();
}

export async function getUser() {
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
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
