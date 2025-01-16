"use server";
import { z } from "zod";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

// Type for market stand data
interface MarketStandData {
  name: string;
  description?: string;
  images: string[];
  tags: string[];
  locationName: string;
  locationGuide: string;
  latitude: number;
  longitude: number;
  userId: string;
}

// Define the market stand schema with coordinate validation
const marketStandSchema = z.object({
  name: z.string().min(3, { message: "The name has to be a min character length of 3" }),
  description: z.string().min(10, { message: "Please describe your market stand in detail" }).optional(),
  images: z.array(z.string(), { message: "Images are required" }),
  tags: z.array(z.string()).default([]),
  locationName: z.string().min(3, { message: "Location name is required" }),
  locationGuide: z.string().min(10, { message: "Please provide detailed directions to find your stand" })
});

// Function to validate and parse market stand data
function validateMarketStandData(data: any): MarketStandData {
  const baseValidation = marketStandSchema.parse(data);
  
  const lat = parseFloat(data.latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("Latitude must be a valid number between -90 and 90 degrees");
  }

  const lng = parseFloat(data.longitude);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    throw new Error("Longitude must be a valid number between -180 and 180 degrees");
  }

  return {
    ...baseValidation,
    latitude: lat,
    longitude: lng,
    userId: data.userId
  };
}

const productSchema = z.object({
  name: z
    .string()
    .min(3, { message: "The name has to be a min character length of 3" }),
  price: z.string()
    .transform((val) => {
      const price = parseFloat(val);
      if (isNaN(price)) throw new Error("Price must be a valid number");
      if (price <= 0) throw new Error("Price must be greater than 0");
      return Math.round(price * 100); // Convert dollars to cents for storage
    }),
  description: z
    .string()
    .min(10, { message: "Please describe your product in detail" }),
  images: z.array(z.string(), { message: "Images are required" }),
  tags: z.array(z.string()).default([]),
  marketStandId: z.string({ required_error: "Market stand is required" }),
  inventory: z.string()
    .transform((val) => {
      const num = parseInt(val || "0", 10);
      if (isNaN(num)) throw new Error("Inventory must be a valid number");
      if (num < 0) throw new Error("Inventory cannot be negative");
      return num;
    })
});

export type State = {
  status: "error" | "success" | undefined;
  errors?: {
    name?: string[];
    price?: string[];
    description?: string[];
    images?: string[];
    marketStandId?: string[];
  };
  message: string | null;
};

export async function SellProduct(
  prevState: State,
  formData: FormData
): Promise<State | Response> {
  try {
    const productId = formData.get("productId")?.toString() || undefined;
    const user = await getUser();

    if (!user || !user.id) {
      return {
        status: "error",
        message: "Not authenticated or invalid user data"
      };
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email ?? '',
          firstName: user.user_metadata?.name?.split(' ')[0] ?? '',
          lastName: user.user_metadata?.name?.split(' ')[1] ?? '',
          profileImage: user.user_metadata?.avatar_url ?? '',
          connectedAccountId: null,
          stripeConnectedLinked: false
        }
      });
    }

    const rawMarketStandId = formData.get("marketStandId");
    const marketStandId = rawMarketStandId ? rawMarketStandId.toString() : undefined;
    if (!marketStandId) {
      return {
        status: "error",
        errors: { marketStandId: ["Market stand is required"] },
        message: "Market stand is required"
      };
    }

    const validateFields = productSchema.safeParse({
      name: formData.get("name")?.toString() ?? "",
      price: formData.get("price")?.toString() ?? "0",
      description: formData.get("description")?.toString() ?? "",
      images: JSON.parse(formData.get("images") as string),
      tags: formData.get("tags") ? JSON.parse(formData.get("tags")?.toString() ?? "[]").map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()) : [],
      marketStandId: marketStandId,
      inventory: formData.get("inventory")?.toString() ?? "0"
    });

    if (!validateFields.success) {
      return {
        status: "error",
        errors: validateFields.error.flatten().fieldErrors,
        message: "Oops, I think there is a mistake with your inputs."
      };
    }

    // If productId exists, update the product instead of creating a new one
    if (productId) {
      const product = await prisma.product.update({
        where: {
          id: productId,
          userId: user.id, // Ensure user owns the product
        },
        data: {
          name: validateFields.data.name,
          description: validateFields.data.description,
          price: validateFields.data.price,
          images: validateFields.data.images,
          tags: validateFields.data.tags,
          marketStandId: validateFields.data.marketStandId,
          inventory: validateFields.data.inventory,
          inventoryUpdatedAt: new Date()
        }
      });

      if (!product) {
        return {
          status: "error",
          message: "Failed to update product"
        };
      }
    } else {
      // Create new product
      const product = await prisma.product.create({
        data: {
          name: validateFields.data.name,
          description: validateFields.data.description,
          price: validateFields.data.price,
          images: validateFields.data.images,
          tags: validateFields.data.tags,
          userId: user.id,
          marketStandId: validateFields.data.marketStandId,
          inventory: validateFields.data.inventory,
          inventoryUpdatedAt: new Date()
        }
      });

      if (!product) {
        return {
          status: "error",
          message: "Failed to create product"
        };
      }
    }

    // Redirect to dashboard after successful product creation/update
    return redirect("/dashboard");
  } catch (error) {
    console.error("[SELL_PRODUCT]", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save product"
    };
  }
}

export async function UpdateMarketStand(
  prevState: any,
  formData: FormData
): Promise<Response> {
  const user = await getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const marketStandId = formData.get("id")?.toString();
  
  if (!marketStandId) {
    return new Response(JSON.stringify({ error: "Market stand ID is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const existingStand = await prisma.marketStand.findUnique({
      where: {
        id: marketStandId,
        userId: user.id
      }
    });

    if (!existingStand) {
      return new Response(JSON.stringify({ error: "Market stand not found or you don't have permission to edit it" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate form data
    const rawImages = formData.get("images");
    const rawFormData = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      images: rawImages ? JSON.parse(rawImages.toString()) : [],
      tags: formData.get("tags") ? JSON.parse(formData.get("tags")?.toString() ?? "[]").map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()) : [],
      locationName: formData.get("locationName")?.toString() ?? "",
      locationGuide: formData.get("locationGuide")?.toString() ?? "",
      latitude: formData.get("latitude")?.toString() ?? "0",
      longitude: formData.get("longitude")?.toString() ?? "0",
      userId: user.id
    };

    // Validate data
    const marketStandData = validateMarketStandData(rawFormData);

    // Perform update
    const marketStand = await prisma.marketStand.update({
      where: {
        id: marketStandId,
        userId: user.id
      },
      data: {
        name: marketStandData.name,
        description: marketStandData.description,
        images: { set: marketStandData.images },
        tags: { set: marketStandData.tags || [] },
        latitude: marketStandData.latitude,
        longitude: marketStandData.longitude,
        locationName: marketStandData.locationName,
        locationGuide: marketStandData.locationGuide,
        userId: marketStandData.userId
      }
    });

    if (!marketStand) {
      return new Response(JSON.stringify({ error: "Failed to update market stand" }), {
        status: 400
      });
    }

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`);
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: "Failed to update market stand. Please try again." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function CreateMarketStand(
  prevState: any,
  formData: FormData
): Promise<Response> {
  const user = await getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse and validate form data
    const rawImages = formData.get("images");
    const rawFormData = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      images: rawImages ? JSON.parse(rawImages.toString()) : [],
      tags: formData.get("tags") ? JSON.parse(formData.get("tags")?.toString() ?? "[]").map((tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()) : [],
      locationName: formData.get("locationName")?.toString() ?? "",
      locationGuide: formData.get("locationGuide")?.toString() ?? "",
      latitude: formData.get("latitude")?.toString() ?? "0",
      longitude: formData.get("longitude")?.toString() ?? "0",
      userId: user.id
    };

    const marketStandData = validateMarketStandData(rawFormData);

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email ?? '',
          firstName: user.user_metadata?.name?.split(' ')[0] ?? '',
          lastName: user.user_metadata?.name?.split(' ')[1] ?? '',
          profileImage: user.user_metadata?.avatar_url ?? '',
          connectedAccountId: null,
          stripeConnectedLinked: false
        }
      });
    }

    // Create the market stand
    const result = await prisma.marketStand.create({
      data: {
        name: marketStandData.name,
        description: marketStandData.description,
        images: { set: marketStandData.images },
        tags: { set: marketStandData.tags || [] },
        latitude: marketStandData.latitude,
        longitude: marketStandData.longitude,
        locationName: marketStandData.locationName,
        locationGuide: marketStandData.locationGuide,
        userId: marketStandData.userId
      }
    });

    if (!result) {
      return new Response(JSON.stringify({ error: "Failed to create market stand" }), {
        status: 400
      });
    }

    // Redirect after successful creation
    return Response.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: "Failed to create market stand. Please try again." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
