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

// Helper function to get required environment variable
const getEnvVar = (key: string, allowEmpty: boolean = false): string => {
  const value = process.env[key];
  if (!value && !allowEmpty) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

// Helper function to get environment variable with safe default
const getEnvVarWithDefault = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  return value || defaultValue;
};

// Environment variables loaded by Next.js
export const env: EnvVars = {
  // Server-side only variables (required)
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  DIRECT_URL: getEnvVar('DIRECT_URL'),
  SUPABASE_JWT_SECRET: getEnvVar('SUPABASE_JWT_SECRET'),
  
  // Public variables (required)
  SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  APP_URL: getEnvVarWithDefault('NEXT_PUBLIC_APP_URL', 'http://localhost:3002'),
  
  // System variables
  NODE_ENV: getEnvVarWithDefault('NODE_ENV', 'development'),
} as const;
