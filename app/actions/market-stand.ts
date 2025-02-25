'use server';

import prisma, { executeWithRetry, withTransaction } from "@/lib/db";
import { WeeklyHours } from "@/types/hours";
import { Prisma } from "@prisma/client";
import { serializeMarketStand } from "@/lib/serializers";
import { handleDatabaseError, createErrorResponse, createNotFoundResponse } from "@/lib/error-handler";

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

    // Use the serializer to convert Prisma model to plain object
    const plainMarketStand = serializeMarketStand(marketStand);

    return Response.json({ success: true, marketStand: plainMarketStand });
  } catch (error) {
    // Use the error handler utility to handle the error consistently
    const errorData = handleDatabaseError(error, "Error creating market stand", {
      userId: formData.get("userId"),
      name: formData.get("name")
    });
    
    return createErrorResponse(errorData);
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

    // Use the serializer to convert Prisma model to plain object
    const plainMarketStand = serializeMarketStand(marketStand);

    return Response.json({ success: true, marketStand: plainMarketStand });
  } catch (error) {
    // Handle "not found" error specifically
    if (error instanceof Error && error.message === 'Market stand not found') {
      const marketStandId = formData.get("id") as string;
      return createNotFoundResponse('Market stand', marketStandId);
    }
    
    // Use the error handler utility for other errors
    const errorData = handleDatabaseError(error, "Error updating market stand", {
      id: formData.get("id"),
      name: formData.get("name")
    });
    
    return createErrorResponse(errorData);
  }
}
