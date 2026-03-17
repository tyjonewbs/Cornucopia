/**
 * Event types
 */

import { EventStatus, EventType, EventVendorStatus } from '@prisma/client';

export interface Event {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  shortDescription: string | null;
  images: string[];
  tags: string[];
  eventType: EventType;
  startDate: Date;
  endDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface EventWithDistance extends Event {
  distanceKm: number;
}

export interface EventWithVendors extends Event {
  vendors: EventVendorInfo[];
  vendorCount: number;
}

export interface EventVendorInfo {
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
  vendor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

export interface CreateEventInput {
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
  locationName: string;
  locationGuide: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude: number;
  longitude: number;
  maxVendors?: number | null;
  maxAttendees?: number | null;
  vendorFee?: number | null;
  isVendorApplicationOpen?: boolean;
  website?: string | null;
  socialMedia?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface UpdateEventInput {
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
  locationName?: string;
  locationGuide?: string;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number;
  longitude?: number;
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

export interface EventFilters {
  organizerId?: string;
  isActive?: boolean;
  eventType?: EventType;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  startAfter?: string;
  startBefore?: string;
  search?: string;
}

export interface EventListResponse {
  events: Event[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
