import { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * Base market stand properties
 */
export interface BaseMarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  createdAt: string;
  tags: string[];
  website: string | null;
  socialMedia: string[];
}

/**
 * Product properties for market stand responses
 */
export interface MarketStandProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended product properties for detailed views
 */
export interface DetailedProduct extends MarketStandProduct {
  inventory: number;
  inventoryUpdatedAt: string | null;
  status: string;
  isActive: boolean;
  tags: string[];
  averageRating: number | null;
  totalReviews: number;
}

/**
 * User properties for market stand responses
 */
export interface MarketStandUser {
  firstName: string | null;
  profileImage: string | null;
}

/**
 * Extended user properties for detailed views
 */
export interface DetailedUser extends MarketStandUser {
  id: string;
  lastName: string | null;
}

/**
 * Market stand response for list view
 */
export interface MarketStandListResponse extends BaseMarketStand {
  products: MarketStandProduct[];
  user: MarketStandUser;
}

/**
 * Market stand response for detailed view
 */
export interface MarketStandDetailResponse extends BaseMarketStand {
  products: DetailedProduct[];
  user: DetailedUser;
}

/**
 * Base error response structure
 */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Validation error response structure
 */
export interface ValidationErrorResponse extends ErrorResponse {
  error: "Validation error";
  details: z.ZodError["formErrors"];
}

/**
 * Type guard for validation error response
 */
export function isValidationError(error: unknown): error is ValidationErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    error.error === "Validation error" &&
    "details" in error
  );
}

/**
 * Prisma select object for list view
 */
export const listViewSelect = {
  id: true,
  name: true,
  description: true,
  images: true,
  latitude: true,
  longitude: true,
  locationName: true,
  locationGuide: true,
  createdAt: true,
  tags: true,
  website: true,
  socialMedia: true,
  products: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      createdAt: true,
      updatedAt: true
    }
  },
  user: {
    select: {
      firstName: true,
      profileImage: true
    }
  }
} satisfies Prisma.MarketStandSelect;

/**
 * Prisma select object for detailed view
 */
export const detailViewSelect = {
  id: true,
  name: true,
  description: true,
  images: true,
  latitude: true,
  longitude: true,
  locationName: true,
  locationGuide: true,
  createdAt: true,
  tags: true,
  website: true,
  socialMedia: true,
  products: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: true,
      inventory: true,
      inventoryUpdatedAt: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      tags: true,
      averageRating: true,
      totalReviews: true
    }
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true
    }
  }
} satisfies Prisma.MarketStandSelect;
