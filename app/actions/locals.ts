"use server";

import prisma, { executeWithRetry } from "lib/db";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createLocal(formData: FormData) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const story = formData.get("story") as string;
  const farmingPractices = formData.get("farmingPractices") as string;
  const wholesaleInfo = formData.get("wholesaleInfo") as string;
  const website = formData.get("website") as string;
  const socialMedia = formData.get("socialMedia") as string;
  const locationName = formData.get("locationName") as string;
  const locationGuide = formData.get("locationGuide") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const images = JSON.parse(formData.get("images") as string) as string[];
  const teamMembers = JSON.parse(formData.get("teamMembers") as string);
  const certifications = JSON.parse(formData.get("certifications") as string);
  const seasonalSchedule = JSON.parse(formData.get("seasonalSchedule") as string);
  const events = JSON.parse(formData.get("events") as string);
  const operatingHours = JSON.parse(formData.get("operatingHours") as string);

  const local = await executeWithRetry(() => prisma.local.create({
    data: {
      name,
      description,
      story,
      farmingPractices,
      wholesaleInfo,
      website,
      socialMedia: socialMedia.split("\n").filter(Boolean),
      locationName,
      locationGuide,
      latitude,
      longitude,
      images,
      teamMembers,
      certifications,
      seasonalSchedule,
      events,
      operatingHours,
      userId: user.id,
      status: "PENDING",
      isActive: true
    }
  }));

  revalidatePath(`/local/${local.id}`);
  redirect(`/local/${local.id}`);
}

export async function updateLocal(id: string, formData: FormData) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const local = await executeWithRetry(() => prisma.local.findUnique({
    where: { id },
    select: { userId: true }
  }));

  if (!local || local.userId !== user.id) {
    throw new Error("Not authorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const story = formData.get("story") as string;
  const farmingPractices = formData.get("farmingPractices") as string;
  const wholesaleInfo = formData.get("wholesaleInfo") as string;
  const website = formData.get("website") as string;
  const socialMedia = formData.get("socialMedia") as string;
  const locationName = formData.get("locationName") as string;
  const locationGuide = formData.get("locationGuide") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const images = JSON.parse(formData.get("images") as string) as string[];
  const teamMembers = JSON.parse(formData.get("teamMembers") as string);
  const certifications = JSON.parse(formData.get("certifications") as string);
  const seasonalSchedule = JSON.parse(formData.get("seasonalSchedule") as string);
  const events = JSON.parse(formData.get("events") as string);
  const operatingHours = JSON.parse(formData.get("operatingHours") as string);

  await executeWithRetry(() => prisma.local.update({
    where: { id },
    data: {
      name,
      description,
      story,
      farmingPractices,
      wholesaleInfo,
      website,
      socialMedia: socialMedia.split("\n").filter(Boolean),
      locationName,
      locationGuide,
      latitude,
      longitude,
      images,
      teamMembers,
      certifications,
      seasonalSchedule,
      events,
      operatingHours
    }
  }));

  revalidatePath(`/local/${id}`);
}
