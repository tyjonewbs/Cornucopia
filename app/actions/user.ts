"use server";

import { isUserProducer } from "@/lib/utils/user";

export async function checkIsProducer(userId: string): Promise<boolean> {
  try {
    return await isUserProducer(userId);
  } catch (error) {
    console.error("Error checking producer status:", error);
    return false;
  }
}
