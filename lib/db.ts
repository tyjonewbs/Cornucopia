import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";

declare global {
  var prisma: PrismaClient | undefined;
}

const RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const POOL_TIMEOUT = 5000; // 5 seconds

const prismaClientSingleton = () => {
<<<<<<< HEAD
  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    logError('Database initialization failed:', {
      error: 'DATABASE_URL environment variable is missing',
=======
  // Clean up URLs by removing any extra quotes
  const cleanUrl = (url: string | undefined) => 
    url?.replace(/^"(.*)"$/, '$1');

  // Get and validate database URLs
  const dbUrl = cleanUrl(process.env.DATABASE_URL);
  const directUrl = cleanUrl(process.env.DIRECT_URL);

  if (!dbUrl) {
    logError('Database initialization failed:', {
      error: 'DATABASE_URL environment variable is missing or invalid',
>>>>>>> loading
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('DATABASE_URL environment variable is required');
  }
<<<<<<< HEAD

  try {
    // Configure Prisma Client with logging
    const client = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
          ...(process.env.DIRECT_URL && {
            directUrl: process.env.DIRECT_URL.replace(/^"|"$/g, '') // Remove any surrounding quotes
          })
        },
      }
    });

    // Log the database configuration for debugging
    logError('Database configuration:', {
      hasUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      nodeEnv: process.env.NODE_ENV
    });

    // Add middleware for query timing and error logging
    client.$use(async (params: any, next: any) => {
      const start = Date.now();
      try {
        const result = await next(params);
        const duration = Date.now() - start;
        
        // Log slow queries (over 1 second)
        if (duration > 1000) {
          logError('Slow query detected:', {
            model: params.model,
            action: params.action,
            duration,
            args: params.args
          });
        }
        
        return result;
      } catch (error) {
        logError('Database query error:', {
=======

  // Configure Prisma Client with logging
  const client = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: dbUrl
      }
    }
  });

  // Log connection details for debugging
  logError('Database configuration:', {
    nodeEnv: process.env.NODE_ENV,
    hasDirectUrl: !!directUrl
  });

  // Add middleware for query timing and error logging
  client.$use(async (params, next) => {
    const start = Date.now();
    try {
      const result = await next(params);
      const duration = Date.now() - start;
      
      // Log slow queries (over 1 second)
      if (duration > 1000) {
        logError('Slow query detected:', {
>>>>>>> loading
          model: params.model,
          action: params.action,
          error,
          args: params.args
        });
        throw error;
      }
    });

    // Handle cleanup
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, async () => {
        await client.$disconnect();
      });
    });

    // Test the connection
    client.$connect().catch(error => {
      logError('Database connection test failed:', {
        error,
        nodeEnv: process.env.NODE_ENV,
        hasDirectUrl: !!process.env.DIRECT_URL
      });
      throw error;
    });

    return client;
  } catch (error) {
    logError('PrismaClient initialization failed:', {
      error,
      nodeEnv: process.env.NODE_ENV,
      hasDirectUrl: !!process.env.DIRECT_URL
    });
    throw error;
  }
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Helper function to reset connection and execute query with retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = RETRY_COUNT,
  currentAttempt = 1
): Promise<T> {
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${CONNECTION_TIMEOUT}ms`));
        }, CONNECTION_TIMEOUT);
      })
    ]);
  } catch (error) {
    // Only retry on connection/prepared statement errors
    if (
      error instanceof Error && 
      currentAttempt < maxRetries &&
      (error.message.includes('Connection pool timeout') ||
       error.message.includes('Connection terminated') ||
       error.message.includes('prepared statement'))
    ) {
      logError(`Retry attempt ${currentAttempt} of ${maxRetries}:`, error);
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, currentAttempt - 1)));
      
      // Reset connection
      await prisma.$disconnect();
      await prisma.$connect();
      
      // Retry operation
      return executeWithRetry(operation, maxRetries, currentAttempt + 1);
    }
    
    throw error;
  }
}

// Helper function for transactions with retry
export async function withTransaction<T>(
  operation: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>,
  maxRetries = RETRY_COUNT
): Promise<T> {
  return executeWithRetry(async () => {
    return await prisma.$transaction(operation, {
      maxWait: POOL_TIMEOUT,
      timeout: CONNECTION_TIMEOUT
    });
  }, maxRetries);
}

// Ensure connections are closed when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
