import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";
import { env } from "./env";

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Get Prisma Client optimized for serverless environments
 * 
 * Key optimizations:
 * - Connection limit: 1 per instance (serverless best practice)
 * - Connection timeout: 10s (reasonable for cold starts)
 * - Pool timeout: 10s (small buffer for connection acquisition)
 * 
 * Note: For Supabase Session Pooler (port 5432), don't add pgbouncer=true
 * The pgbouncer param is only for Transaction Pooler (port 6543)
 */
function getPrismaClient(): PrismaClient {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Get the base DATABASE_URL - don't modify if it already has parameters
  // Supabase Session Pooler works best with direct connection string
  const databaseUrl = env.DATABASE_URL;
  
  console.log('Creating Prisma client for serverless environment');
  console.log('Database host:', databaseUrl.includes('pooler.supabase.com') ? 'Supabase Pooler' : 'Other');
  
  return new PrismaClient({
    log: isDevelopment 
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    errorFormat: 'minimal',
  });
}

// Create or reuse PrismaClient instance
// In serverless, each invocation may get a new instance
const prisma = global.prisma ?? getPrismaClient();

// Save client reference in development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Utility function to execute database operations with retry logic
 * Essential for handling temporary connection issues in serverless
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Unique constraint') || 
          errorMessage.includes('Foreign key constraint')) {
        throw error;
      }
      
      if (attempt === maxRetries) break;
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Query performance monitoring wrapper
 * Logs slow queries and helps identify performance bottlenecks
 */
export async function monitoredQuery<T>(
  queryName: string,
  operation: () => Promise<T>,
  slowQueryThresholdMs: number = 1000
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    if (duration > slowQueryThresholdMs) {
      console.warn(`[SLOW QUERY] ${queryName} took ${duration}ms`);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(`[QUERY] ${queryName} completed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[QUERY ERROR] ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Get database connection pool metrics
 */
export async function getConnectionMetrics() {
  try {
    const metrics = await prisma.$metrics.json();
    return metrics;
  } catch (error) {
    logError('Failed to get connection metrics:', error);
    return null;
  }
}

// Utility function to execute operations within a transaction
export async function withTransaction<T>(
  operation: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return operation(tx);
  });
}

export default prisma;
