'use server';

import { eventService } from "@/lib/services/eventService";
import { EventType, EventStatus } from "@prisma/client";
import prisma from "@/lib/db";

/**
 * Create a new event
 */
export async function CreateEvent(
  _: { status: undefined; message: null },
  formData: FormData
) {
  try {
    const organizerId = formData.get("organizerId") as string;
    const userEmail = formData.get("userEmail") as string;
    const userFirstName = formData.get("userFirstName") as string || 'User';
    const userLastName = formData.get("userLastName") as string || '';
    const userProfileImage = formData.get("userProfileImage") as string || '';

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: organizerId },
      update: {
        email: userEmail || '',
        firstName: userFirstName,
        lastName: userLastName,
        profileImage: userProfileImage,
      },
      create: {
        id: organizerId,
        email: userEmail || '',
        firstName: userFirstName,
        lastName: userLastName,
        profileImage: userProfileImage,
        role: 'USER',
      },
    });

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const shortDescription = formData.get("shortDescription") as string;
    const eventType = formData.get("eventType") as EventType;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const isRecurring = formData.get("isRecurring") === "true";
    const recurringSchedule = formData.get("recurringSchedule")
      ? JSON.parse(formData.get("recurringSchedule") as string)
      : null;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const locationName = formData.get("locationName") as string;
    const locationGuide = formData.get("locationGuide") as string;
    const streetAddress = formData.get("streetAddress") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const maxVendors = formData.get("maxVendors")
      ? parseInt(formData.get("maxVendors") as string)
      : null;
    const maxAttendees = formData.get("maxAttendees")
      ? parseInt(formData.get("maxAttendees") as string)
      : null;
    const vendorFee = formData.get("vendorFee")
      ? parseInt(formData.get("vendorFee") as string)
      : null;
    const isVendorApplicationOpen = formData.get("isVendorApplicationOpen") !== "false";
    const website = formData.get("website") as string;
    const images = JSON.parse(formData.get("images") as string) as string[];
    const tags = JSON.parse(formData.get("tags") as string) as string[];
    const socialMedia = JSON.parse(formData.get("socialMedia") as string) as string[];
    const contactEmail = formData.get("contactEmail") as string;
    const contactPhone = formData.get("contactPhone") as string;

    const event = await eventService.createEvent({
      organizerId,
      name,
      description,
      shortDescription: shortDescription || null,
      eventType: eventType || EventType.FARMERS_MARKET,
      startDate,
      endDate,
      isRecurring,
      recurringSchedule,
      latitude,
      longitude,
      locationName,
      locationGuide,
      streetAddress: streetAddress || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      maxVendors,
      maxAttendees,
      vendorFee,
      isVendorApplicationOpen,
      website: website || null,
      images,
      tags,
      socialMedia,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      status: EventStatus.PENDING,
      isActive: true,
    });

    return { success: true, event };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating event",
    };
  }
}

/**
 * Update an existing event
 */
export async function UpdateEvent(
  _: { status: undefined; message: null },
  formData: FormData
) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const shortDescription = formData.get("shortDescription") as string;
    const eventType = formData.get("eventType") as EventType;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const isRecurring = formData.get("isRecurring") === "true";
    const recurringSchedule = formData.get("recurringSchedule")
      ? JSON.parse(formData.get("recurringSchedule") as string)
      : null;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const locationName = formData.get("locationName") as string;
    const locationGuide = formData.get("locationGuide") as string;
    const streetAddress = formData.get("streetAddress") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const zipCode = formData.get("zipCode") as string;
    const maxVendors = formData.get("maxVendors")
      ? parseInt(formData.get("maxVendors") as string)
      : null;
    const maxAttendees = formData.get("maxAttendees")
      ? parseInt(formData.get("maxAttendees") as string)
      : null;
    const vendorFee = formData.get("vendorFee")
      ? parseInt(formData.get("vendorFee") as string)
      : null;
    const isVendorApplicationOpen = formData.get("isVendorApplicationOpen") !== "false";
    const website = formData.get("website") as string;
    const images = JSON.parse(formData.get("images") as string) as string[];
    const tags = JSON.parse(formData.get("tags") as string) as string[];
    const socialMedia = JSON.parse(formData.get("socialMedia") as string) as string[];
    const contactEmail = formData.get("contactEmail") as string;
    const contactPhone = formData.get("contactPhone") as string;

    const event = await eventService.updateEvent(id, {
      name,
      description,
      shortDescription: shortDescription || null,
      eventType,
      startDate,
      endDate,
      isRecurring,
      recurringSchedule,
      latitude,
      longitude,
      locationName,
      locationGuide,
      streetAddress: streetAddress || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      maxVendors,
      maxAttendees,
      vendorFee,
      isVendorApplicationOpen,
      website: website || null,
      images,
      tags,
      socialMedia,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    });

    return { success: true, event };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating event",
    };
  }
}

/**
 * Delete an event
 */
export async function DeleteEvent(id: string, userId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.organizerId !== userId) {
      return { success: false, error: "Unauthorized: You don't own this event" };
    }

    await prisma.event.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error deleting event",
    };
  }
}
