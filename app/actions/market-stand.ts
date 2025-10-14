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
