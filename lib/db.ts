import { PrismaClient } from "@prisma/client";
import { logError } from "./logger";
import { env } from "./env";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  console.log('Creating new Prisma client with DATABASE_URL:', env.DATABASE_URL.substring(0, 50) + '...');
  
  return new PrismaClient({
    log: ['error', 'warn', 'info']
  });
}

async function initializePrismaClient(client: PrismaClient): Promise<void> {
  try {
    console.log('Attempting to connect to database...');
    await client.$connect();
    console.log('Connected to database, verifying connection...');
    const result = await client.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('Database connection verified:', result);
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

// Utility function to execute database operations with retry logic
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
      if (attempt === maxRetries) break;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError;
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
