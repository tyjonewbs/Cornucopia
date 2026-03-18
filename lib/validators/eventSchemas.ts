import { z } from "zod";
import { EventStatus, EventType, EventVendorStatus } from "@prisma/client";

// Event creation schema
export const createEventSchema = z.object({
  organizerId: z.string().uuid("Invalid organizer ID"),
  name: z.string().min(1, "Event name is required").max(255),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(500).nullable().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  eventType: z.nativeEnum(EventType).default(EventType.FARMERS_MARKET),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  isRecurring: z.boolean().default(false),
  recurringSchedule: z.any().nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().min(1, "Location name is required").max(255),
  locationGuide: z.string().min(1, "Location guide is required"),
  streetAddress: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(10).nullable().optional(),
  maxVendors: z.number().int().positive().nullable().optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
  vendorFee: z.number().int().min(0).nullable().optional(),
  isVendorApplicationOpen: z.boolean().default(true),
  website: z.string().url().nullable().optional(),
  socialMedia: z.array(z.string().url()).default([]),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  status: z.nativeEnum(EventStatus).default(EventStatus.PENDING),
  isActive: z.boolean().default(true),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Event update schema - all fields optional
export const updateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  images: z.array(z.string().url()).min(1).optional(),
  tags: z.array(z.string()).optional(),
  eventType: z.nativeEnum(EventType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurringSchedule: z.any().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().min(1).max(255).optional(),
  locationGuide: z.string().min(1).optional(),
  streetAddress: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(10).nullable().optional(),
  maxVendors: z.number().int().positive().nullable().optional(),
  maxAttendees: z.number().int().positive().nullable().optional(),
  vendorFee: z.number().int().min(0).nullable().optional(),
  isVendorApplicationOpen: z.boolean().optional(),
  website: z.string().url().nullable().optional(),
  socialMedia: z.array(z.string().url()).optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  isActive: z.boolean().optional(),
});

// Event query schema
export const getEventsQuerySchema = z.object({
  organizerId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
  isActive: z.boolean().default(true),
  eventType: z.nativeEnum(EventType).optional(),
  startAfter: z.string().datetime().optional(),
  startBefore: z.string().datetime().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(200).optional(),
});

// Event ID schema
export const eventIdSchema = z.string().uuid("Invalid event ID");

// Event vendor application schema
export const createEventVendorSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  vendorId: z.string().uuid("Invalid vendor ID"),
  requestMessage: z.string().max(1000).nullable().optional(),
});

// Event vendor update schema (organizer approve/reject)
export const updateEventVendorSchema = z.object({
  status: z.nativeEnum(EventVendorStatus),
  responseNote: z.string().max(1000).nullable().optional(),
  boothNumber: z.string().max(50).nullable().optional(),
  boothLocation: z.string().nullable().optional(),
});

// Export types
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;
