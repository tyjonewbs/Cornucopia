// Type definitions for environment variables
type EnvVars = {
  // Server-side only variables
  DATABASE_URL: string;
  DIRECT_URL: string;
  SUPABASE_JWT_SECRET: string;
  
  // Public variables (NEXT_PUBLIC_*)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  APP_URL: string;
  
  // System variables
  NODE_ENV: string;
};

// Default values for development
const defaultValues = {
  DATABASE_URL: 'postgresql://postgres.fzlelklnibjzpgrquzrq:JxdbOlO57Tra5sVi@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
  DIRECT_URL: 'postgresql://postgres.fzlelklnibjzpgrquzrq:JxdbOlO57Tra5sVi@db.fzlelklnibjzpgrquzrq.supabase.co:5432/postgres',
  SUPABASE_JWT_SECRET: 'ZYPX7/BjldmstZS0Wr9udSv3GboYOule1ef30W4N14OgXKNsXedq+X/kep/YZIN9O+97J3/frs3wi8Z1+Mo2FA==',
  SUPABASE_URL: 'https://fzlelklnibjzpgrquzrq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bGVsa2xuaWJqenBncnF1enJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTYwNjcsImV4cCI6MjA1MDYzMjA2N30.TEaKFsDU7JJwmX70KTRX740oH43wEDQjn1tguG0n7_o',
  APP_URL: 'http://localhost:3002',
  NODE_ENV: 'development'
};

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`Warning: ${key} environment variable is not set. Using default value.`);
    return defaultValue;
  }
  return value;
};

// Environment variables loaded by Next.js with fallbacks
export const env: EnvVars = {
  // Server-side only variables
  DATABASE_URL: getEnvVar('DATABASE_URL', defaultValues.DATABASE_URL),
  DIRECT_URL: getEnvVar('DIRECT_URL', defaultValues.DIRECT_URL),
  SUPABASE_JWT_SECRET: getEnvVar('SUPABASE_JWT_SECRET', defaultValues.SUPABASE_JWT_SECRET),
  
  // Public variables (NEXT_PUBLIC_*)
  SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', defaultValues.SUPABASE_URL),
  SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', defaultValues.SUPABASE_ANON_KEY),
  APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', defaultValues.APP_URL),
  
  // System variables
  NODE_ENV: getEnvVar('NODE_ENV', defaultValues.NODE_ENV),
} as const;
