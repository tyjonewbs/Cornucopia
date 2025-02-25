import { env } from './env';  // Import env directly

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  redirectUrl: string;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_ANON_KEY,
    redirectUrl: `${env.APP_URL}/dashboard`,
  };
};

export const getAuthRedirectUrl = (path: string = '/'): string => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.APP_URL}${normalizedPath}`;
};
