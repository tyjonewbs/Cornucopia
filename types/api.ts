/**
 * Standard API Response Types
 * Provides consistent response structure across all API endpoints
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    field?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Cursor-based pagination
 */
export interface CursorPaginationMeta {
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  limit: number;
}

/**
 * Standard list response
 */
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta | CursorPaginationMeta;
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}
