import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";
import { env } from "./env";

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Get Prisma Client with optimized connection pooling
 * Connection pool configuration for production:
 * - Pool size: 5-10 connections (adjustable based on load)
 * - Connection timeout: 20 seconds
 * - Query timeout: 15 seconds
 */
function getPrismaClient(): PrismaClient {
  console.log('Creating new Prisma client with DATABASE_URL:', env.DATABASE_URL.substring(0, 50) + '...');
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return new PrismaClient({
    log: isDevelopment 
      ? ['query', 'error', 'warn', 'info']
      : ['error', 'warn'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
}

/**
 * Initialize Prisma Client with connection verification and metrics
 */
async function initializePrismaClient(client: PrismaClient): Promise<void> {
  try {
    console.log('Attempting to connect to database...');
    await client.$connect();
    console.log('Connected to database, verifying connection...');
    
    const result = await client.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database connection verified:', result);
    
    // Enable query logging in development
    if (process.env.NODE_ENV !== 'production') {
      client.$on('query' as any, (e: any) => {
        console.log('Query: ' + e.query);
        console.log('Duration: ' + e.duration + 'ms');
      });
    }
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    throw error;
  }
}

// Create or reuse PrismaClient instance
const prisma = global.prisma ?? (() => {
  const client = getPrismaClient();

  // Initialize the client
  initializePrismaClient(client).catch(error => {
    logError('Failed to initialize Prisma client:', error);
  });

  return client;
})();

// Save client reference in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Utility function to execute database operations with retry logic
 * Useful for handling temporary connection issues
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
