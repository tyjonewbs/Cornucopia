// Import and execute env module first to ensure environment variables are loaded
import '@/lib/env';

// Then import other dependencies that might need environment variables
import { config } from '@/lib/config';
import { env } from '@/lib/env';

export function EnvProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log environment status in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Environment variables loaded:', {
      databaseUrl: env.DATABASE_URL ? 'set' : 'missing',
      supabaseUrl: env.SUPABASE_URL ? 'set' : 'missing',
      appUrl: env.APP_URL ? 'set' : 'missing',
    });
  }

  return <>{children}</>;
}
