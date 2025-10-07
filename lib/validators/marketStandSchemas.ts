import { z } from "zod";
import { Status } from "@prisma/client";

// Weekly hours schema
const dayHoursSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  closed: z.boolean().default(false),
});

export const weeklyHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

// Market stand creation schema
export const createMarketStandSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  name: z.string().min(1, "Market stand name is required").max(255),
  description: z.string().min(1, "Description is required"),
  locationName: z.string().min(1, "Location name is required").max(255),
  locationGuide: z.string().min(1, "Location guide is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  website: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  socialMedia: z.array(z.string().url()).default([]),
  hours: weeklyHoursSchema,
  status: z.nativeEnum(Status).default(Status.PENDING),
  isActive: z.boolean().default(true),
});

// Market stand update schema - all fields optional except validation rules
export const updateMarketStandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  locationName: z.string().min(1).max(255).optional(),
  locationGuide: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  website: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).min(1).optional(),
  tags: z.array(z.string()).optional(),
  socialMedia: z.array(z.string().url()).optional(),
  hours: weeklyHoursSchema.optional(),
  status: z.nativeEnum(Status).optional(),
  isActive: z.boolean().optional(),
});

// Market stand query schema
export const getMarketStandsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
  isActive: z.boolean().default(true),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(100).optional(),
});

// Market stand ID schema
export const marketStandIdSchema = z.string().uuid("Invalid market stand ID");

// Export types
export type CreateMarketStandInput = z.infer<typeof createMarketStandSchema>;
export type UpdateMarketStandInput = z.infer<typeof updateMarketStandSchema>;
export type GetMarketStandsQuery = z.infer<typeof getMarketStandsQuerySchema>;
export type WeeklyHours = z.infer<typeof weeklyHoursSchema>;
