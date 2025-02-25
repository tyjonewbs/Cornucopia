// Import env first to ensure it's loaded
import { env } from './env';

export const config = {
  database: {
    url: env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    jwtSecret: env.SUPABASE_JWT_SECRET,
  },
  app: {
    url: env.APP_URL,
  },
  env: env.NODE_ENV || 'development',
} as const;
