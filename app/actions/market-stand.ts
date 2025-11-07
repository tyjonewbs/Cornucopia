'use server';

import { marketStandService } from "@/lib/services/marketStandService";
import { MarketStandDTO, WeeklyHours } from "@/lib/dto/marketStand.dto";
import { createErrorResponse, createNotFoundResponse } from "@/lib/error-handler";
import { Status } from "@prisma/client";
import prisma from "@/lib/db";

/**
 * Create a new market stand
 * Uses the market stand service layer for business logic and validation
 */
export async function CreateMarketStand(
  _: { status: undefined; message: null },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
    const userEmail = formData.get("userEmail") as string;
    const userFirstName = formData.get("userFirstName") as string || 'User';
    const userLastName = formData.get("userLastName") as string || '';
    const userProfileImage = formData.get("userProfileImage") as string || '';
    
    // Ensure user exists in database (create if not exists)
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: userEmail || '',
        firstName: userFirstName,
        lastName: userLastName,
        profileImage: userProfileImage,
      },
      create: {
        id: userId,
        email: userEmail || '',
        firstName: userFirstName,
        lastName: userLastName,
        profileImage: userProfileImage,
        role: 'USER',
      },
    });

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const locationName = formData.get("locationName") as string;
    const streetAddress = formData.get("streetAddress") as string;
    const city = formData.get("city") as string;
    const zipCode = formData.get("zipCode") as string;
    const locationGuide = formData.get("locationGuide") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const website = formData.get("website") as string;
    const images = JSON.parse(formData.get("images") as string) as string[];
    const tags = JSON.parse(formData.get("tags") as string) as string[];
    const socialMedia = JSON.parse(formData.get("socialMedia") as string) as string[];
    const hours = JSON.parse(formData.get("hours") as string) as WeeklyHours;

    const marketStand = await marketStandService.createMarketStand({
      userId,
      name,
      description,
      locationName,
      streetAddress: streetAddress || null,
      city: city || null,
      zipCode: zipCode || null,
      locationGuide,
      latitude,
      longitude,
      website: website || null,
      images,
      tags,
      socialMedia,
      hours,
      status: Status.PENDING,
      isActive: true,
    });

    return { success: true, marketStand };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating market stand"
    };
  }
}

/**
 * Update an existing market stand
 * Uses the market stand service layer for business logic and validation
 */
export async function UpdateMarketStand(
  _: { status: undefined; message: null },
  formData: FormData
) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const locationName = formData.get("locationName") as string;
    const streetAddress = formData.get("streetAddress") as string;
    const city = formData.get("city") as string;
    const zipCode = formData.get("zipCode") as string;
    const locationGuide = formData.get("locationGuide") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const website = formData.get("website") as string;
    const images = JSON.parse(formData.get("images") as string) as string[];
    const tags = JSON.parse(formData.get("tags") as string) as string[];
    const socialMedia = JSON.parse(formData.get("socialMedia") as string) as string[];
    const hours = JSON.parse(formData.get("hours") as string) as WeeklyHours;

    const marketStand = await marketStandService.updateMarketStand(id, {
      name,
      description,
      locationName,
      streetAddress: streetAddress || null,
      city: city || null,
      zipCode: zipCode || null,
      locationGuide,
      latitude,
      longitude,
      website: website || null,
      images,
      tags,
      socialMedia,
      hours,
    });

    return { success: true, marketStand };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error updating market stand"
    };
  }
}

/**
 * Delete a market stand
 * Uses the market stand service layer for business logic and validation
 */
export async function DeleteMarketStand(id: string, userId: string) {
  try {
    // Verify ownership before deleting
    const marketStand = await prisma.marketStand.findUnique({
      where: { id }
    });

    if (!marketStand) {
      return {
        success: false,
        error: "Market stand not found"
      };
    }

    if (marketStand.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized: You don't own this market stand"
      };
    }

    // Delete the market stand (cascading deletes will handle related records)
    await prisma.marketStand.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error deleting market stand"
    };
  }
}
