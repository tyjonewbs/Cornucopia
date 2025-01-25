import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  // Configure Prisma Client with logging
  const client = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    }
  });

  // Handle cleanup
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
      await client.$disconnect();
    });
  });

  return client;
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Ensure connections are closed when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Helper function to reset connection and execute query with retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 1
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If this isn't our first attempt, reset the connection
      if (attempt > 0) {
        await prisma.$disconnect();
        await prisma.$connect();
      }
      
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry on connection/prepared statement errors
      if (!(error instanceof Error) || 
          !error.message.includes('prepared statement') &&
          !error.message.includes('connection')) {
        throw error;
      }
      
      // If we've exhausted our retries, throw the last error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait briefly before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw lastError;
}

export default prisma;
