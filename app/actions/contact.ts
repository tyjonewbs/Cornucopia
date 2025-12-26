"use server";

import { z } from "zod";
import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";

export type ContactState = {
  status: "error" | "success" | undefined;
  errors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
    category?: string[];
  };
  message: string | null;
};

const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(20, { message: "Message must be at least 20 characters" }),
  category: z.enum(["GENERAL", "SUPPORT", "FEEDBACK"], {
    message: "Please select a valid category"
  })
});

export async function submitContactForm(
  prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  try {
    // Get current user (optional - can be guest)
    const user = await getUser();

    // Validate form data
    const validateFields = contactSchema.safeParse({
      name: formData.get("name")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      subject: formData.get("subject")?.toString() ?? "",
      message: formData.get("message")?.toString() ?? "",
      category: formData.get("category")?.toString() ?? "GENERAL"
    });

    if (!validateFields.success) {
      return {
        status: "error",
        errors: validateFields.error.flatten().fieldErrors,
        message: "Please check your inputs and try again."
      };
    }

    // Create contact submission
    await prisma.contactSubmission.create({
      data: {
        name: validateFields.data.name,
        email: validateFields.data.email,
        subject: validateFields.data.subject,
        message: validateFields.data.message,
        category: validateFields.data.category,
        userId: user?.id ?? null,
        status: "NEW",
        priority: "MEDIUM"
      }
    });

    return {
      status: "success",
      message: "Thank you for contacting us! We'll respond to your message soon."
    };
  } catch (error) {
    console.error("Contact form submission error:", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again later."
    };
  }
}

export async function updateContactStatus(
  id: string,
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    
    if (!user || (user.user_metadata?.role !== "ADMIN" && user.user_metadata?.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.contactSubmission.update({
      where: { id },
      data: {
        status,
        ...(status === "RESOLVED" || status === "CLOSED" ? {
          respondedAt: new Date(),
          respondedById: user.id
        } : {})
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating contact status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function updateContactPriority(
  id: string,
  priority: "LOW" | "MEDIUM" | "HIGH"
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    
    if (!user || (user.user_metadata?.role !== "ADMIN" && user.user_metadata?.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.contactSubmission.update({
      where: { id },
      data: { priority }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating contact priority:", error);
    return { success: false, error: "Failed to update priority" };
  }
}

export async function addAdminNotes(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    
    if (!user || (user.user_metadata?.role !== "ADMIN" && user.user_metadata?.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.contactSubmission.update({
      where: { id },
      data: { adminNotes: notes }
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding admin notes:", error);
    return { success: false, error: "Failed to add notes" };
  }
}
