"use server";

import prisma, { executeWithRetry } from "lib/db";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

// Helper to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 255); // Limit length
}

export async function createLocal(formData: FormData) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  // Basic fields
  const name = formData.get("name") as string;
  const tagline = formData.get("tagline") as string || null;
  const description = formData.get("description") as string;
  const story = formData.get("story") as string;
  const missionStatement = formData.get("missionStatement") as string || null;
  
  // Farm stats
  const foundedYearStr = formData.get("foundedYear") as string;
  const foundedYear = foundedYearStr ? parseInt(foundedYearStr) : null;
  const acreageStr = formData.get("acreage") as string;
  const acreage = acreageStr ? parseFloat(acreageStr) : null;
  const generationNumberStr = formData.get("generationNumber") as string;
  const generationNumber = generationNumberStr ? parseInt(generationNumberStr) : null;
  
  // Media
  const images = JSON.parse(formData.get("images") as string || "[]") as string[];
  const videoUrl = formData.get("videoUrl") as string || null;
  
  // Practices
  const farmingPractices = formData.get("farmingPractices") as string;
  
  // Social
  const instagramHandle = formData.get("instagramHandle") as string || null;
  const facebookPageUrl = formData.get("facebookPageUrl") as string || null;
  const website = formData.get("website") as string || null;
  
  // Location
  const locationName = formData.get("locationName") as string;
  const locationGuide = formData.get("locationGuide") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const wholesaleInfo = formData.get("wholesaleInfo") as string || null;
  
  // JSON fields
  const teamMembers = JSON.parse(formData.get("teamMembers") as string || "[]");
  const certifications = JSON.parse(formData.get("certifications") as string || "[]");
  const values = JSON.parse(formData.get("values") as string || "[]");
  const seasonalSchedule = JSON.parse(formData.get("seasonalSchedule") as string || "{}");
  const events = JSON.parse(formData.get("events") as string || "{}");
  const operatingHours = JSON.parse(formData.get("operatingHours") as string || "{}");
  
  //Generate unique slug
  let slug = generateSlug(name);
  let slugExists = await prisma.local.findUnique({ where: { slug } });
  let counter = 1;
  while (slugExists) {
    slug = `${generateSlug(name)}-${counter}`;
    slugExists = await prisma.local.findUnique({ where: { slug } });
    counter++;
  }

  const local = await executeWithRetry(() => prisma.local.create({
    data: {
      name,
      slug,
      tagline,
      description,
      story,
      missionStatement,
      foundedYear,
      acreage,
      generationNumber,
      images,
      videoUrl,
      farmingPractices,
      instagramHandle,
      facebookPageUrl,
      website,
      locationName,
      locationGuide,
      latitude,
      longitude,
      wholesaleInfo,
      teamMembers,
      certifications,
      values,
      seasonalSchedule,
      events,
      operatingHours,
      socialMedia: [],
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
