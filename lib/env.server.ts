import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// This file only runs on the server side
export function loadEnvConfig() {
  const projectDir = process.cwd();
  const envFiles = ['.env.local', '.env'] as const;
  let loadedVars: Record<string, { value: string; source: string }> = {};

  for (const file of envFiles) {
    const envPath = path.resolve(projectDir, file);

    try {
      const result = config({
        path: envPath,
        override: false // Don't override existing variables to maintain precedence
      });

      if (!result.error && result.parsed) {
        Object.entries(result.parsed).forEach(([key, value]) => {
          if (!loadedVars[key]) {
            loadedVars[key] = { value, source: file };
          }
        });
      }
    } catch (error) {
      // Silently skip missing env files
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
const defaultValues: Record<string, never> = {};

// Validate environment on server startup
export function validateEnv() {
  const { loadedVars, envFiles, projectDir } = loadEnvConfig();

  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPABASE_JWT_SECRET'
  ] as const;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      // Set default value if available
      if (defaultValues[envVar as keyof typeof defaultValues]) {
        process.env[envVar] = defaultValues[envVar as keyof typeof defaultValues];
      }
    }
  }

  // Check if any required variables are still missing after applying defaults
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.warn(
      `Warning: The following environment variables are missing and have no defaults:\n` +
      missingVars.join(', ') + '\n' +
      `The application may not function correctly.`
    );
  }
}
