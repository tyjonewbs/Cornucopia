import { z } from "zod";

/**
 * Delivery Zone Validation Schemas
 */

const deliveryTimeWindowSchema = z.object({
  day: z.enum([
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});

export const deliveryZoneSchema = z.object({
  name: z.string()
    .min(1, "Zone name is required")
    .max(255, "Zone name must be less than 255 characters"),
  
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  
  zipCodes: z.array(z.string().regex(/^\d{5}$/, "Invalid ZIP code"))
    .min(0, "At least one coverage area is required"),
  
  cities: z.array(z.string().min(1))
    .min(0),
  
  states: z.array(z.string().length(2, "State must be 2-letter code"))
    .min(0),
  
  deliveryFee: z.number()
    .int("Delivery fee must be an integer")
    .min(0, "Delivery fee cannot be negative"),
  
  freeDeliveryThreshold: z.number()
    .int("Threshold must be an integer")
    .min(0, "Threshold cannot be negative")
    .optional()
    .nullable(),
  
  minimumOrder: z.number()
    .int("Minimum order must be an integer")
    .min(0, "Minimum order cannot be negative")
    .optional()
    .nullable(),
  
  deliveryDays: z.array(z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ])).min(1, "Select at least one delivery day"),
  
  deliveryTimeWindows: z.array(deliveryTimeWindowSchema)
    .optional()
    .nullable(),
  
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // At least one coverage area must be specified
    return data.zipCodes.length > 0 || data.cities.length > 0 || data.states.length > 0;
  },
  {
    message: "At least one coverage area (ZIP code, city, or state) is required",
    path: ["zipCodes"],
  }
);

export const createDeliveryZoneSchema = deliveryZoneSchema;

// For updates, we need to define partial separately since .partial() doesn't work on ZodEffects
const baseDeliveryZoneSchema = z.object({
  name: z.string()
    .min(1, "Zone name is required")
    .max(255, "Zone name must be less than 255 characters"),
  
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  
  zipCodes: z.array(z.string().regex(/^\d{5}$/, "Invalid ZIP code"))
    .min(0),
  
  cities: z.array(z.string().min(1))
    .min(0),
  
  states: z.array(z.string().length(2, "State must be 2-letter code"))
    .min(0),
  
  deliveryFee: z.number()
    .int("Delivery fee must be an integer")
    .min(0, "Delivery fee cannot be negative"),
  
  freeDeliveryThreshold: z.number()
    .int("Threshold must be an integer")
    .min(0, "Threshold cannot be negative")
    .optional()
    .nullable(),
  
  minimumOrder: z.number()
    .int("Minimum order must be an integer")
    .min(0, "Minimum order cannot be negative")
    .optional()
    .nullable(),
  
  deliveryDays: z.array(z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ])).min(1, "Select at least one delivery day"),
  
  deliveryTimeWindows: z.array(deliveryTimeWindowSchema)
    .optional()
    .nullable(),
  
  isActive: z.boolean().default(true),
});

export const updateDeliveryZoneSchema = baseDeliveryZoneSchema.partial();

// Validation for product stand listing
export const productStandListingSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  marketStandId: z.string().uuid("Invalid market stand ID"),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

export const createProductStandListingSchema = productStandListingSchema;

export const updateProductStandListingSchema = productStandListingSchema.partial().extend({
  id: z.string().uuid("Invalid listing ID"),
});

// Helper schema for validating delivery zone coverage
export const checkDeliveryZoneCoverageSchema = z.object({
  deliveryZoneId: z.string().uuid("Invalid delivery zone ID"),
  zipCode: z.string().regex(/^\d{5}$/, "Invalid ZIP code").optional(),
  city: z.string().optional(),
  state: z.string().length(2, "State must be 2-letter code").optional(),
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>;
export type ProductStandListingInput = z.infer<typeof productStandListingSchema>;
export type CreateProductStandListingInput = z.infer<typeof createProductStandListingSchema>;
export type UpdateProductStandListingInput = z.infer<typeof updateProductStandListingSchema>;
export type CheckDeliveryZoneCoverageInput = z.infer<typeof checkDeliveryZoneCoverageSchema>;
