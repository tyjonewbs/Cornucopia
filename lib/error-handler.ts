/**
 * Utility functions for consistent error handling across the application
 */

import { Prisma } from "@prisma/client";
import { logError } from "./logger";

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Handle database errors consistently
 */
export function handleDatabaseError(
  error: unknown,
  context: string,
  metadata: Record<string, any> = {}
): ErrorResponse {
  // Log the error with context and metadata
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logError(`${context} - Prisma known request error:`, {
      code: error.code,
      meta: error.meta,
      message: error.message,
      ...metadata
    });
    
    return {
      error: `Database operation failed: ${error.message}`,
      code: error.code,
      details: { ...metadata, meta: error.meta }
    };
  } 
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logError(`${context} - Prisma initialization error:`, {
      message: error.message,
      clientVersion: error.clientVersion,
      ...metadata
    });
    
    return {
      error: 'Database connection error. Please try again later.',
      code: 'INITIALIZATION_ERROR',
      details: { ...metadata }
    };
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    logError(`${context} - Prisma validation error:`, {
      message: error.message,
      ...metadata
    });
    
    return {
      error: 'Invalid data provided for database operation.',
      code: 'VALIDATION_ERROR',
      details: { ...metadata }
    };
  }
  
  // Generic error handling
  logError(`${context} - Unknown error:`, {
    error,
    ...metadata
  });
  
  return {
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    details: { ...metadata }
  };
}

/**
 * Create a JSON response for an error
 */
export function createErrorResponse(
  errorResponse: ErrorResponse,
  status: number = 500
): Response {
  return Response.json(errorResponse, { status });
}

/**
 * Handle not found errors
 */
export function createNotFoundResponse(
  resourceType: string,
  id: string
): Response {
  return Response.json(
    { error: `${resourceType} not found`, resourceId: id },
    { status: 404 }
  );
}
