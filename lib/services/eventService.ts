import prisma from "@/lib/db";
import {
  createEventSchema,
  updateEventSchema,
  getEventsQuerySchema,
  eventIdSchema,
  createEventVendorSchema,
  updateEventVendorSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type GetEventsQuery,
} from "@/lib/validators/eventSchemas";
import { EventDTO, EventVendorDTO, EventQueryFilters } from "@/lib/dto/event.dto";
import { handleDatabaseError } from "@/lib/error-handler";
import { ZodError } from "zod";

function serializeEvent(event: any): EventDTO {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    shortDescription: event.shortDescription,
    images: event.images,
    tags: event.tags,
    eventType: event.eventType,
    startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
    endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
    isRecurring: event.isRecurring,
    recurringSchedule: event.recurringSchedule,
    latitude: event.latitude,
    longitude: event.longitude,
    locationName: event.locationName,
    locationGuide: event.locationGuide,
    streetAddress: event.streetAddress,
    city: event.city,
    state: event.state,
    zipCode: event.zipCode,
    maxVendors: event.maxVendors,
    maxAttendees: event.maxAttendees,
    vendorFee: event.vendorFee,
    isVendorApplicationOpen: event.isVendorApplicationOpen,
    website: event.website,
    socialMedia: event.socialMedia,
    contactEmail: event.contactEmail,
    contactPhone: event.contactPhone,
    status: event.status,
    isActive: event.isActive,
    organizerId: event.organizerId,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
  };
}

function serializeEventVendor(vendor: any): EventVendorDTO {
  return {
    id: vendor.id,
    eventId: vendor.eventId,
    vendorId: vendor.vendorId,
    status: vendor.status,
    requestedAt: vendor.requestedAt instanceof Date ? vendor.requestedAt.toISOString() : vendor.requestedAt,
    requestMessage: vendor.requestMessage,
    respondedAt: vendor.respondedAt instanceof Date ? vendor.respondedAt.toISOString() : vendor.respondedAt,
    responseNote: vendor.responseNote,
    boothNumber: vendor.boothNumber,
    boothLocation: vendor.boothLocation,
    specialNotes: vendor.specialNotes,
    createdAt: vendor.createdAt instanceof Date ? vendor.createdAt.toISOString() : vendor.createdAt,
    updatedAt: vendor.updatedAt instanceof Date ? vendor.updatedAt.toISOString() : vendor.updatedAt,
    ...(vendor.vendor ? {
      vendor: {
        id: vendor.vendor.id,
        firstName: vendor.vendor.firstName,
        lastName: vendor.vendor.lastName,
        profileImage: vendor.vendor.profileImage,
      },
    } : {}),
  };
}

/**
 * Event Service - Contains business logic for event operations
 */
export class EventService {
  /**
   * Get multiple events with filtering
   */
  async getEvents(query: GetEventsQuery): Promise<EventDTO[]> {
    try {
      const validatedQuery = getEventsQuerySchema.parse(query);

      const where: any = {
        isActive: validatedQuery.isActive,
      };

      if (validatedQuery.organizerId) {
        where.organizerId = validatedQuery.organizerId;
      }

      if (validatedQuery.eventType) {
        where.eventType = validatedQuery.eventType;
      }

      if (validatedQuery.startAfter || validatedQuery.startBefore) {
        where.startDate = {};
        if (validatedQuery.startAfter) {
          where.startDate.gte = new Date(validatedQuery.startAfter);
        }
        if (validatedQuery.startBefore) {
          where.startDate.lte = new Date(validatedQuery.startBefore);
        }
      }

      // Location-based filtering (bounding box approximation)
      if (
        validatedQuery.latitude !== undefined &&
        validatedQuery.longitude !== undefined &&
        validatedQuery.radiusKm !== undefined
      ) {
        const latDelta = validatedQuery.radiusKm / 111;
        const lngDelta = validatedQuery.radiusKm / (111 * Math.cos(validatedQuery.latitude * Math.PI / 180));
        where.latitude = {
          gte: validatedQuery.latitude - latDelta,
          lte: validatedQuery.latitude + latDelta,
        };
        where.longitude = {
          gte: validatedQuery.longitude - lngDelta,
          lte: validatedQuery.longitude + lngDelta,
        };
      }

      if (validatedQuery.cursor) {
        where.id = { gt: validatedQuery.cursor };
      }

      const events = await prisma.event.findMany({
        where,
        take: validatedQuery.limit,
        orderBy: { startDate: "asc" },
      });

      return events.map(serializeEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      const errorData = handleDatabaseError(error, "Failed to fetch events", { query });
      console.error('Error fetching events:', errorData);
      return [];
    }
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string): Promise<EventDTO | null> {
    try {
      const validatedId = eventIdSchema.parse(id);
      const event = await prisma.event.findUnique({
        where: { id: validatedId },
      });
      if (!event) return null;
      return serializeEvent(event);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid event ID: ${error.errors[0].message}`);
      }
      const errorData = handleDatabaseError(error, "Failed to fetch event", { eventId: id });
      console.error('Error fetching event:', errorData);
      return null;
    }
  }

  /**
   * Create a new event
   */
  async createEvent(input: CreateEventInput): Promise<EventDTO> {
    try {
      const validatedData = createEventSchema.parse(input);

      const event = await prisma.event.create({
        data: {
          ...validatedData,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
        },
      });

      // Create metrics record
      await prisma.eventMetrics.create({
        data: { eventId: event.id },
      });

      return serializeEvent(event);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      const errorData = handleDatabaseError(error, "Failed to create event", {
        name: input.name,
        organizerId: input.organizerId,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, input: UpdateEventInput): Promise<EventDTO> {
    try {
      const validatedId = eventIdSchema.parse(id);
      const validatedData = updateEventSchema.parse(input);

      const exists = await prisma.event.findUnique({ where: { id: validatedId } });
      if (!exists) {
        throw new Error(`Event with ID ${validatedId} not found`);
      }

      const updateData: any = { ...validatedData };
      if (validatedData.startDate) {
        updateData.startDate = new Date(validatedData.startDate);
      }
      if (validatedData.endDate) {
        updateData.endDate = new Date(validatedData.endDate);
      }

      const event = await prisma.event.update({
        where: { id: validatedId },
        data: updateData,
      });

      return serializeEvent(event);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      const errorData = handleDatabaseError(error, "Failed to update event", { eventId: id });
      throw new Error(errorData.error);
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      const validatedId = eventIdSchema.parse(id);

      const exists = await prisma.event.findUnique({ where: { id: validatedId } });
      if (!exists) {
        throw new Error(`Event with ID ${validatedId} not found`);
      }

      await prisma.event.delete({ where: { id: validatedId } });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid event ID: ${error.errors[0].message}`);
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      const errorData = handleDatabaseError(error, "Failed to delete event", { eventId: id });
      throw new Error(errorData.error);
    }
  }

  /**
   * Get events by organizer user ID
   */
  async getEventsByOrganizerId(userId: string): Promise<EventDTO[]> {
    try {
      const events = await prisma.event.findMany({
        where: { organizerId: userId },
        orderBy: { startDate: "desc" },
      });
      return events.map(serializeEvent);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch user events", { userId });
      console.error('Error fetching user events:', errorData);
      return [];
    }
  }

  /**
   * Check if user owns the event
   */
  async checkEventOwnership(eventId: string, userId: string): Promise<boolean> {
    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizerId: userId },
      });
      return event !== null;
    } catch (error) {
      console.error('Error checking event ownership:', error);
      return false;
    }
  }

  // --- Vendor Management ---

  /**
   * Apply as a vendor for an event
   */
  async applyAsVendor(eventId: string, vendorId: string, requestMessage?: string): Promise<EventVendorDTO> {
    try {
      const validated = createEventVendorSchema.parse({ eventId, vendorId, requestMessage });

      // Check event exists and is accepting applications
      const event = await prisma.event.findUnique({ where: { id: validated.eventId } });
      if (!event) {
        throw new Error("Event not found");
      }
      if (!event.isVendorApplicationOpen) {
        throw new Error("This event is not accepting vendor applications");
      }
      if (event.organizerId === validated.vendorId) {
        throw new Error("The event organizer cannot apply as a vendor");
      }

      // Check max vendors limit
      if (event.maxVendors) {
        const approvedCount = await prisma.eventVendor.count({
          where: { eventId: validated.eventId, status: "APPROVED" },
        });
        if (approvedCount >= event.maxVendors) {
          throw new Error("This event has reached its maximum number of vendors");
        }
      }

      const vendor = await prisma.eventVendor.create({
        data: {
          eventId: validated.eventId,
          vendorId: validated.vendorId,
          requestMessage: validated.requestMessage,
        },
        include: {
          vendor: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
        },
      });

      return serializeEventVendor(vendor);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      if (error instanceof Error) throw error;
      const errorData = handleDatabaseError(error, "Failed to apply as vendor", { eventId, vendorId });
      throw new Error(errorData.error);
    }
  }

  /**
   * Approve a vendor application (organizer only)
   */
  async approveVendor(
    eventId: string,
    vendorId: string,
    responseNote?: string,
    boothNumber?: string,
    boothLocation?: string
  ): Promise<EventVendorDTO> {
    try {
      const validated = updateEventVendorSchema.parse({
        status: "APPROVED",
        responseNote,
        boothNumber,
        boothLocation,
      });

      const vendor = await prisma.eventVendor.update({
        where: { eventId_vendorId: { eventId, vendorId } },
        data: {
          status: validated.status,
          responseNote: validated.responseNote,
          boothNumber: validated.boothNumber,
          boothLocation: validated.boothLocation,
          respondedAt: new Date(),
        },
        include: {
          vendor: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
        },
      });

      return serializeEventVendor(vendor);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      const errorData = handleDatabaseError(error, "Failed to approve vendor", { eventId, vendorId });
      throw new Error(errorData.error);
    }
  }

  /**
   * Reject a vendor application (organizer only)
   */
  async rejectVendor(eventId: string, vendorId: string, responseNote?: string): Promise<EventVendorDTO> {
    try {
      const vendor = await prisma.eventVendor.update({
        where: { eventId_vendorId: { eventId, vendorId } },
        data: {
          status: "REJECTED",
          responseNote: responseNote || null,
          respondedAt: new Date(),
        },
        include: {
          vendor: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
        },
      });

      return serializeEventVendor(vendor);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to reject vendor", { eventId, vendorId });
      throw new Error(errorData.error);
    }
  }

  /**
   * Withdraw a vendor application (vendor only)
   */
  async withdrawVendorApplication(eventId: string, vendorId: string): Promise<void> {
    try {
      await prisma.eventVendor.update({
        where: { eventId_vendorId: { eventId, vendorId } },
        data: { status: "WITHDRAWN" },
      });
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to withdraw application", { eventId, vendorId });
      throw new Error(errorData.error);
    }
  }

  /**
   * Get all vendors for an event
   */
  async getEventVendors(eventId: string): Promise<EventVendorDTO[]> {
    try {
      const vendors = await prisma.eventVendor.findMany({
        where: { eventId },
        include: {
          vendor: {
            select: { id: true, firstName: true, lastName: true, profileImage: true },
          },
        },
        orderBy: { requestedAt: "asc" },
      });

      return vendors.map(serializeEventVendor);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch event vendors", { eventId });
      console.error('Error fetching event vendors:', errorData);
      return [];
    }
  }

  /**
   * Get all events a vendor is participating in
   */
  async getVendorEvents(vendorId: string): Promise<EventDTO[]> {
    try {
      const vendorships = await prisma.eventVendor.findMany({
        where: { vendorId, status: "APPROVED" },
        include: { event: true },
        orderBy: { event: { startDate: "asc" } },
      });

      return vendorships.map(v => serializeEvent(v.event));
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch vendor events", { vendorId });
      console.error('Error fetching vendor events:', errorData);
      return [];
    }
  }
}

// Export singleton instance
export const eventService = new EventService();
