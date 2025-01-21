import { z } from "zod";

/**
 * Schema for market stand creation/update
 */
export const marketStandSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name must be less than 100 characters"),
  
  description: z.string()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must be less than 1000 characters")
    .nullable(),
  
  images: z.array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required")
    .max(10, "Maximum of 10 images allowed"),
  
  latitude: z.number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  
  longitude: z.number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  
  locationName: z.string()
    .min(3, "Location name must be at least 3 characters long")
    .max(100, "Location name must be less than 100 characters"),
  
  locationGuide: z.string()
    .min(10, "Location guide must be at least 10 characters long")
    .max(500, "Location guide must be less than 500 characters"),
  
  tags: z.array(z.string())
    .max(10, "Maximum of 10 tags allowed")
    .optional()
    .default([]),
    
  website: z.string()
    .url("Website must be a valid URL")
    .optional()
    .nullable(),
    
  socialMedia: z.array(z.string().url("Social media links must be valid URLs"))
    .max(5, "Maximum of 5 social media links allowed")
    .optional()
    .default([]),
  
  userId: z.string()
    .min(1, "User ID is required")
});

/**
 * Type for validated market stand input
 */
export type MarketStandInput = z.infer<typeof marketStandSchema>;

/**
 * Validates market stand input data
 */
export function validateMarketStandInput(data: unknown): MarketStandInput {
  return marketStandSchema.parse(data);
}

/**
 * Safely validates market stand input data, returning errors if invalid
 */
export function safeValidateMarketStandInput(data: unknown) {
  return marketStandSchema.safeParse(data);
}
