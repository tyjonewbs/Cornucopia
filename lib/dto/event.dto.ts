import { EventStatus, EventType, EventVendorStatus } from "@prisma/client";

// Base event DTO (serialized dates as strings)
export interface EventDTO {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  shortDescription: string | null;
  images: string[];
  tags: string[];
  eventType: EventType;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  recurringSchedule: any | null;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  maxVendors: number | null;
  maxAttendees: number | null;
  vendorFee: number | null;
  isVendorApplicationOpen: boolean;
  website: string | null;
  socialMedia: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  status: EventStatus;
  isActive: boolean;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

// Event creation DTO
export interface CreateEventDTO {
  organizerId: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  images: string[];
  tags: string[];
  eventType: EventType;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringSchedule?: any | null;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  maxVendors?: number | null;
  maxAttendees?: number | null;
  vendorFee?: number | null;
  isVendorApplicationOpen?: boolean;
  website?: string | null;
  socialMedia?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: EventStatus;
  isActive?: boolean;
}

// Event update DTO
export interface UpdateEventDTO {
  name?: string;
  description?: string;
  shortDescription?: string | null;
  images?: string[];
  tags?: string[];
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  recurringSchedule?: any | null;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationGuide?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  maxVendors?: number | null;
  maxAttendees?: number | null;
  vendorFee?: number | null;
  isVendorApplicationOpen?: boolean;
  website?: string | null;
  socialMedia?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  status?: EventStatus;
  isActive?: boolean;
}

// Event query filters
export interface EventQueryFilters {
  organizerId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
  eventType?: EventType;
  startAfter?: string;
  startBefore?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// Event list response
export interface EventListDTO {
  events: EventDTO[];
  nextCursor?: string;
  hasMore: boolean;
}

// Event with distance (for location-based queries)
export interface EventWithDistanceDTO extends EventDTO {
  distanceKm: number;
}

// Event vendor DTO
export interface EventVendorDTO {
  id: string;
  eventId: string;
  vendorId: string;
  status: EventVendorStatus;
  requestedAt: string;
  requestMessage: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  boothNumber: string | null;
  boothLocation: string | null;
  specialNotes: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

// Create event vendor application DTO
export interface CreateEventVendorDTO {
  eventId: string;
  vendorId: string;
  requestMessage?: string | null;
}

// Update event vendor DTO (for organizer approve/reject)
export interface UpdateEventVendorDTO {
  status: EventVendorStatus;
  responseNote?: string | null;
  boothNumber?: string | null;
  boothLocation?: string | null;
}
