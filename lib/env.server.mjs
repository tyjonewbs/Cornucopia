// This file only runs on the server side during build/runtime
// It validates that required environment variables are available in process.env

// Default values for development (when vars are not set in environment)
const defaultValues = {
  DATABASE_URL: 'postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
  DIRECT_URL: 'postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@db.swhinhgrtcowjmpstozh.supabase.co:5432/postgres',
  SUPABASE_JWT_SECRET: 'ZYPX7/BjldmstZS0Wr9udSv3GboYOule1ef30W4N14OgXKNsXedq+X/kep/YZIN9O+97J3/frs3wi8Z1+Mo2FA==',
  NEXT_PUBLIC_SUPABASE_URL: 'https://swhinhgrtcowjmpstozh.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bGVsa2xuaWJqenBncnF1enJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTYwNjcsImV4cCI6MjA1MDYzMjA2N30.TEaKFsDU7JJwmX70KTRX740oH43wEDQjn1tguG0n7_o',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3002',
};

// Validate environment variables
export function validateEnv() {
  console.log('Validating environment variables...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Vercel environment:', process.env.VERCEL_ENV);
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPABASE_JWT_SECRET'
  ];

  const missingVars = [];
  const appliedDefaults = [];

  console.log('\nChecking required environment variables:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    
    if (value) {
      // Mask sensitive values for logging
      const maskedValue = envVar.toLowerCase().includes('key') || 
                        envVar.toLowerCase().includes('secret') || 
                        envVar.toLowerCase().includes('password') || 
                        envVar.toLowerCase().includes('token')
        ? '****'
        : value.substring(0, 20) + (value.length > 20 ? '...' : '');
      console.log(`✓ ${envVar}: ${maskedValue}`);
    } else if (defaultValues[envVar]) {
      // Apply default value
      process.env[envVar] = defaultValues[envVar];
      appliedDefaults.push(envVar);
      console.log(`⚠ ${envVar}: using default value`);
    } else {
      missingVars.push(envVar);
      console.log(`✗ ${envVar}: MISSING`);
    }
  }

  if (appliedDefaults.length > 0) {
    console.log(`\nApplied defaults for: ${appliedDefaults.join(', ')}`);
  }

  if (missingVars.length > 0) {
    const errorMessage = 
      `Missing required environment variables:\n${missingVars.join(', ')}\n\n` +
      `For Vercel deployment:\n` +
      `1. Go to your Vercel project settings\n` +
      `2. Navigate to Environment Variables\n` +
      `3. Add the missing variables\n\n` +
      `For local development:\n` +
      `1. Create a .env.local file in the project root\n` +
      `2. Add the missing variables`;
    
    console.error('\n' + errorMessage);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('\n✓ Environment validation completed successfully');
}
