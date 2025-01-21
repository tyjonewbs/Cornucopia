import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ErrorResponse } from "./types";

/**
 * Serializes Date objects to ISO strings in an object
 */
export function serializeDates<T extends Record<string, any>>(obj: T): T {
  const serialized = { ...obj };
  
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      (serialized as any)[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      (serialized as any)[key] = value.map(item => 
        typeof item === 'object' && item !== null ? serializeDates(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      (serialized as any)[key] = serializeDates(value);
    }
  }
  
  return serialized;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): NextResponse<ErrorResponse> {
  console.error("API Error:", {
    error,
    message: error instanceof Error ? error.message : "Unknown error"
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      {
        error: "Database error",
        details: error.message
      },
      { status: 400 }
    );
  }

  // Handle not found errors
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return NextResponse.json(
      { error: "Resource not found" },
      { status: 404 }
    );
  }

  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.message
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  const statusCode = error instanceof Error && 
    (error as any).statusCode ? 
    (error as any).statusCode : 
    500;

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : defaultMessage,
      details: process.env.NODE_ENV === "development" ? error : undefined
    },
    { status: statusCode }
  );
}

/**
 * Validates market stand ID format
 */
export function validateMarketStandId(id: string): boolean {
  // Add any specific ID format validation logic here
  return typeof id === "string" && id.length > 0;
}

/**
 * Wraps an async route handler with error handling
 */
export function withErrorHandling<T, E = ErrorResponse>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | E>> {
  return handler().catch(error => createErrorResponse(error) as NextResponse<E>);
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return typeof response === "object" && 
    response !== null && 
    "error" in response;
}
