import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";

declare global {
  var prisma: PrismaClient | undefined;
}

const RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second - increased for better stability
const CONNECTION_TIMEOUT = 10000; // 10 seconds - increased for stability
const POOL_TIMEOUT = 5000; // 5 seconds
const MAX_CONNECTIONS = 15; // Match Supabase pool size
const CONNECT_TIMEOUT = 10000; // 10 seconds for initial connection

// Connection pool configuration
const poolConfig = {
  max: MAX_CONNECTIONS,
  min: 1, // Keep at least one connection alive
  idleTimeoutMillis: 30000, // 30 seconds - allow more time for idle connections
  acquireTimeoutMillis: POOL_TIMEOUT,
  reapIntervalMillis: 1000, // Clean up idle connections every 1 second
};

const prismaClientSingleton = () => {
  // Clean up URLs by removing any extra quotes
  const cleanUrl = (url: string | undefined) => 
    url?.replace(/^"(.*)"$/, '$1');

  // Get and validate database URLs
  const dbUrl = cleanUrl(process.env.DATABASE_URL);
  const directUrl = cleanUrl(process.env.DIRECT_URL);

  if (!dbUrl) {
    logError('Database initialization failed:', {
      error: 'DATABASE_URL environment variable is missing or invalid',
      nodeEnv: process.env.NODE_ENV
    });
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Enable prepared statements for better performance
    process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = 'false';

    // Configure Prisma Client with optimized settings
    const client = new PrismaClient({
      log: ['error', 'warn']
    });

    // Set Prisma environment variables for connection optimization
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
    process.env.PRISMA_ENGINE_PROTOCOL = 'graphql';
    process.env.PRISMA_CLIENT_CONNECTION_LIMIT = String(MAX_CONNECTIONS);

    // Log the database configuration for debugging
    logError('Database configuration:', {
      hasUrl: !!dbUrl,
      hasDirectUrl: !!directUrl,
      nodeEnv: process.env.NODE_ENV
    });

    // Initialize connection with warmup
    const warmupConnection = async () => {
      try {
        await client.$connect();
        // Perform a simple query to warm up the connection
        await client.$queryRaw`SELECT 1`;
        console.log('Database connection established and warmed up');
      } catch (error) {
        console.error('Failed to connect to database:', {
          error,
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!dbUrl
        });
        // Attempt reconnection after a delay
        setTimeout(warmupConnection, RETRY_DELAY);
      }
    };

    // Initialize warm connection
    warmupConnection().catch(console.error);

    // Enhanced middleware for query optimization and monitoring
    client.$use(async (params: any, next: any) => {
      const start = Date.now();
      const queryId = Math.random().toString(36).substring(7);
      
      try {
        // Track active queries for monitoring
        const activeQueries = (global as any).activeQueries || new Set();
        activeQueries.add(queryId);
        (global as any).activeQueries = activeQueries;

        const result = await Promise.race([
          next(params),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Query timeout after ${CONNECTION_TIMEOUT}ms`));
            }, CONNECTION_TIMEOUT);
          })
        ]);

        const duration = Date.now() - start;
        
        // Log slow queries with more context
        if (duration > 1000) {
          logError('Slow query detected:', {
            queryId,
            model: params.model,
            action: params.action,
            duration,
            args: params.args,
            activeConnections: activeQueries.size
          });
        }
        
        // Cleanup
        activeQueries.delete(queryId);
        return result;
      } catch (error) {
        logError('Database query error:', {
          queryId,
          model: params.model,
          action: params.action,
          error,
          args: params.args,
          duration: Date.now() - start
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

    return client;
  } catch (error) {
    logError('PrismaClient initialization failed:', {
      error,
      nodeEnv: process.env.NODE_ENV
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

// Enhanced helper function with better retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = RETRY_COUNT,
  currentAttempt = 1
): Promise<T> {
  const activeQueries = (global as any).activeQueries || new Set();
  // Check connection pool state
  if (activeQueries.size >= MAX_CONNECTIONS) {
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }

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
    // Enhanced error handling with specific error types
    if (
      error instanceof Error && 
      currentAttempt < maxRetries &&
      (error.message.includes('Connection pool timeout') ||
       error.message.includes('Connection terminated') ||
       error.message.includes('prepared statement') ||
       error.message.includes('Connection refused') ||
       error.message.includes('too many connections'))
    ) {
      logError(`Retry attempt ${currentAttempt} of ${maxRetries}:`, {
        error,
        activeConnections: activeQueries.size,
        attempt: currentAttempt
      });
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 100;
      const delay = RETRY_DELAY * Math.pow(2, currentAttempt - 1) + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Force connection reset
      try {
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 100)); // Cool-down period
        await prisma.$connect();
      } catch (reconnectError) {
        logError('Reconnection failed:', reconnectError);
      }
      
      return executeWithRetry(operation, maxRetries, currentAttempt + 1);
    }
    
    throw error;
  }
}

// Enhanced transaction helper with better timeout handling
export async function withTransaction<T>(
  operation: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>,
  maxRetries = RETRY_COUNT
): Promise<T> {
  return executeWithRetry(async () => {
    return await prisma.$transaction(operation, {
      maxWait: POOL_TIMEOUT,
      timeout: CONNECTION_TIMEOUT,
      isolationLevel: 'ReadCommitted' // Explicit isolation level
    });
  }, maxRetries);
}

// Monitor connection pool health
setInterval(async () => {
  const activeQueries = (global as any).activeQueries || new Set();
  if (activeQueries.size > 0) {
    logError('Connection pool status:', {
      activeConnections: activeQueries.size,
      maxConnections: MAX_CONNECTIONS,
      timestamp: new Date().toISOString()
    });
  }
}, 30000); // Check every 30 seconds

// Ensure connections are closed when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
