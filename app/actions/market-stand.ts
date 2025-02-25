'use server';

import prisma, { executeWithRetry, withTransaction } from "@/lib/db";
import { WeeklyHours } from "@/types/hours";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/logger";

export async function CreateMarketStand(
  _: { status: undefined; message: null },
  formData: FormData
) {
  try {
    const userId = formData.get("userId") as string;
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

    const marketStand = await withTransaction(async (tx) => {
      return tx.marketStand.create({
        data: {
          userId,
          name,
          description,
          locationName,
          locationGuide,
          latitude,
          longitude,
          website,
          images,
          tags,
          socialMedia,
          hours,
        },
      });
    });

    // Convert Prisma model to plain object to avoid serialization issues
    const plainMarketStand = {
      id: marketStand.id,
      name: marketStand.name,
      description: marketStand.description,
      locationName: marketStand.locationName,
      locationGuide: marketStand.locationGuide,
      latitude: marketStand.latitude,
      longitude: marketStand.longitude,
      website: marketStand.website,
      images: marketStand.images,
      tags: marketStand.tags,
      socialMedia: marketStand.socialMedia,
      hours: marketStand.hours,
      userId: marketStand.userId,
      createdAt: marketStand.createdAt.toISOString(),
      updatedAt: marketStand.updatedAt.toISOString()
    };

    return Response.json({ success: true, marketStand: plainMarketStand });
  } catch (error) {
    // Log detailed error information to the console
    console.error("Error creating market stand:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error meta:", error.meta);
    }
    
    logError("Error creating market stand:", {
      error,
      userId: formData.get("userId"),
      name: formData.get("name")
    });
    
    return Response.json(
      { error: `Failed to create market stand: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

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

    const marketStand = await withTransaction(async (tx) => {
      // First verify the market stand exists
      const existing = await tx.marketStand.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new Error('Market stand not found');
      }

      return tx.marketStand.update({
        where: { id },
        data: {
          name,
          description,
          locationName,
          locationGuide,
          latitude,
          longitude,
          website,
          images,
          tags,
          socialMedia,
          hours,
        },
      });
    });

    // Convert Prisma model to plain object to avoid serialization issues
    const plainMarketStand = {
      id: marketStand.id,
      name: marketStand.name,
      description: marketStand.description,
      locationName: marketStand.locationName,
      locationGuide: marketStand.locationGuide,
      latitude: marketStand.latitude,
      longitude: marketStand.longitude,
      website: marketStand.website,
      images: marketStand.images,
      tags: marketStand.tags,
      socialMedia: marketStand.socialMedia,
      hours: marketStand.hours,
      userId: marketStand.userId,
      createdAt: marketStand.createdAt.toISOString(),
      updatedAt: marketStand.updatedAt.toISOString()
    };

    return Response.json({ success: true, marketStand: plainMarketStand });
  } catch (error) {
    // Log detailed error information to the console
    console.error("Error updating market stand:", error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error meta:", error.meta);
    }
    
    logError("Error updating market stand:", {
      error,
      id: formData.get("id"),
      name: formData.get("name")
    });
    
    if (error instanceof Error && error.message === 'Market stand not found') {
      return Response.json(
        { error: "Market stand not found" },
        { status: 404 }
      );
    }
    
    return Response.json(
      { error: `Failed to update market stand: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
