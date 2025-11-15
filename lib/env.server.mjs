import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This file only runs on the server side
export function loadEnvConfig() {
  console.log('Loading environment variables...');
  
  const projectDir = process.cwd();
  console.log('Project directory:', projectDir);
  
  const envFiles = ['.env.local', '.env'];
  const loadedVars = {};

  for (const file of envFiles) {
    const envPath = path.resolve(projectDir, file);
    console.log(`\nProcessing ${file}:`);
    console.log(`Full path: ${envPath}`);

    try {
      const result = config({
        path: envPath,
        override: false // Don't override existing variables to maintain precedence
      });
      
      if (result.error) {
        console.error(`Error loading ${file}:`, result.error);
      } else {
        if (result.parsed) {
          // Store the loaded variables with their source
          Object.entries(result.parsed).forEach(([key, value]) => {
            if (!loadedVars[key]) { // Only set if not already set (maintain precedence)
              loadedVars[key] = { value, source: file };
            }
          });
          
          console.log(`${file} loaded successfully with ${Object.keys(result.parsed).length} variables:`);
          Object.keys(result.parsed).forEach(key => {
            // Mask sensitive values
            const value = result.parsed[key];
            const maskedValue = key.toLowerCase().includes('key') || 
                              key.toLowerCase().includes('secret') || 
                              key.toLowerCase().includes('password') || 
                              key.toLowerCase().includes('token')
              ? '****'
              : value.substring(0, 20) + (value.length > 20 ? '...' : '');
            console.log(`  ${key}: ${maskedValue}`);
          });
        } else {
          console.log(`${file} parsed but no variables found`);
        }
      }
    } catch (error) {
      console.error(`Failed to load ${file}:`, error);
    }
  }

  // Explicitly set process.env with loaded variables
  Object.entries(loadedVars).forEach(([key, { value }]) => {
    process.env[key] = value;
  });

  return { loadedVars, envFiles, projectDir };
}

// SECURITY: DO NOT hardcode credentials here! 
// All values should come from environment variables only.
// This is just for type reference and error messages.
const defaultValues = {};

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
