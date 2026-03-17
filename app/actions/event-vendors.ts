'use server';

import { eventService } from "@/lib/services/eventService";
import prisma from "@/lib/db";

/**
 * Apply as a vendor for an event
 */
export async function ApplyAsEventVendor(
  eventId: string,
  vendorId: string,
  requestMessage?: string
) {
  try {
    const vendor = await eventService.applyAsVendor(eventId, vendorId, requestMessage);
    return { success: true, vendor };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error applying as vendor",
    };
  }
}

/**
 * Approve a vendor application (organizer only)
 */
export async function ApproveEventVendor(
  eventId: string,
  vendorId: string,
  organizerId: string,
  responseNote?: string,
  boothNumber?: string,
  boothLocation?: string
) {
  try {
    // Verify organizer ownership
    const isOwner = await eventService.checkEventOwnership(eventId, organizerId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized: You don't own this event" };
    }

    const vendor = await eventService.approveVendor(eventId, vendorId, responseNote, boothNumber, boothLocation);
    return { success: true, vendor };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error approving vendor",
    };
  }
}

/**
 * Reject a vendor application (organizer only)
 */
export async function RejectEventVendor(
  eventId: string,
  vendorId: string,
  organizerId: string,
  responseNote?: string
) {
  try {
    // Verify organizer ownership
    const isOwner = await eventService.checkEventOwnership(eventId, organizerId);
    if (!isOwner) {
      return { success: false, error: "Unauthorized: You don't own this event" };
    }

    const vendor = await eventService.rejectVendor(eventId, vendorId, responseNote);
    return { success: true, vendor };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error rejecting vendor",
    };
  }
}

/**
 * Withdraw a vendor application (vendor only)
 */
export async function WithdrawEventVendorApplication(
  eventId: string,
  vendorId: string
) {
  try {
    await eventService.withdrawVendorApplication(eventId, vendorId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error withdrawing application",
    };
  }
}

/**
 * Get all vendors for an event
 */
export async function GetEventVendors(eventId: string) {
  try {
    const vendors = await eventService.getEventVendors(eventId);
    return { success: true, vendors };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error fetching vendors",
      vendors: [],
    };
  }
}
