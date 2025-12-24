"use server";

import { createServerSupabaseClient } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const userSettingsSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
});

export type State = {
  status: "error" | "success" | undefined;
  message: string | null;
};

export async function UpdateUserSettings(prevState: State, formData: FormData): Promise<State> {
  const supabase = createServerSupabaseClient();
  // Use getUser() for secure server-side auth validation
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "error",
      message: "Not authenticated"
    };
  }

  const validateFields = userSettingsSchema.safeParse({
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
  });

  if (!validateFields.success) {
    return {
      status: "error",
      message: "Please check your inputs and try again."
    };
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        firstName: validateFields.data.firstName,
        lastName: validateFields.data.lastName,
      }
    });

    return {
      status: "success",
      message: "Settings updated successfully"
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update settings. Please try again."
    };
  }
}
