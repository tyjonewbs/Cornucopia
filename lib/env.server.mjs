import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
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
  ];

  console.log('\nChecking required environment variables:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const source = loadedVars[envVar]?.source;
    console.log(`${envVar}: ${value ? `set (from ${source})` : 'missing'}`);
    if (!value) {
      console.log(`  Expected in: ${envFiles.join(' or ')}`);
      console.log(`  Searched in:`);
      envFiles.forEach(file => {
        const fullPath = path.resolve(projectDir, file);
        console.log(`    ${fullPath} (exists: ${fs.existsSync(fullPath)})`);
      });
      
      // Set default value if available
      if (defaultValues[envVar]) {
        process.env[envVar] = defaultValues[envVar];
        console.log(`  Using default value for ${envVar}`);
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
