"use server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod";
import prisma from "../lib/db";
import { stripe } from "../lib/stripe";
import Stripe from "stripe";
import { redirect, RedirectType } from "next/navigation";

// Type and validation for Stripe account IDs
const stripeAccountIdSchema = z.string().refine((id) => /^acct_[a-zA-Z0-9]+$/.test(id), {
  message: "Invalid Stripe account ID format"
});

type StripeAccountId = z.infer<typeof stripeAccountIdSchema>;

// Helper function to validate and cast string to StripeAccountId
function asStripeAccountId(id: string): StripeAccountId {
  const result = stripeAccountIdSchema.safeParse(id);
  if (!result.success) {
    throw new Error("Invalid Stripe account ID");
  }
  return result.data;
}

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

// Helper function to validate and parse coordinates
const parseCoordinate = (val: string | null | undefined, isLatitude: boolean): number => {
  const num = parseFloat(val || "0");
  if (isNaN(num)) throw new Error("Must be a valid number");
  if (isLatitude) {
    if (num < -90 || num > 90) throw new Error("Latitude must be between -90 and 90 degrees");
  } else {
    if (num < -180 || num > 180) throw new Error("Longitude must be between -180 and 180 degrees");
  }
  return num;
};

// Type for market stand data
interface MarketStandData {
  name: string;
  description?: string;
  images: string[];
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
  marketStandId: z.string({ required_error: "Market stand is required" }),
  inventory: z.string()
    .transform((val) => {
      const num = parseInt(val || "0", 10);
      if (isNaN(num)) throw new Error("Inventory must be a valid number");
      if (num < 0) throw new Error("Inventory cannot be negative");
      return num;
    })
});

const userSettingsSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "Minimum length of 3 required" })
    .or(z.literal(""))
    .optional(),
  lastName: z
    .string()
    .min(3, { message: "Minimum length of 3 required" })
    .or(z.literal(""))
    .optional()
});

export async function SellProduct(
  prevState: State,
  formData: FormData
): Promise<State | Response> {
  const productId = formData.get("productId")?.toString() || undefined;
  const { getUser } = getKindeServerSession();
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
        firstName: user.given_name ?? '',
        lastName: user.family_name ?? '',
        profileImage: user.picture ?? '',
        connectedAccountId: '', // This will need to be set up through Stripe later
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
  const product = productId
    ? await prisma.product.update({
        where: {
          id: productId,
          userId: user.id, // Ensure user owns the product
        },
        data: {
          name: validateFields.data.name,
          description: validateFields.data.description,
          price: validateFields.data.price,
          images: validateFields.data.images,
          marketStandId: validateFields.data.marketStandId,
          inventory: validateFields.data.inventory,
          inventoryUpdatedAt: new Date()
        },
        include: {
          user: {
            select: {
              connectedAccountId: true
            }
          }
        }
      })
    : await prisma.product.create({
        data: {
          name: validateFields.data.name,
          description: validateFields.data.description,
          price: validateFields.data.price,
          images: validateFields.data.images,
          userId: user.id,
          marketStandId: validateFields.data.marketStandId,
          inventory: validateFields.data.inventory,
          inventoryUpdatedAt: new Date()
        },
        include: {
          user: {
            select: {
              connectedAccountId: true
            }
          }
        }
      });

  if (!product) {
    throw new Error("Failed to create/update product");
  }

  if (!product.user.connectedAccountId) {
    throw new Error("Seller has not set up their payment account yet");
  }

  // Price is already in cents from our schema transformation
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment' as const,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.description,
            images: product.images,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round(product.price * 0.1),
      transfer_data: {
        destination: asStripeAccountId(product.user.connectedAccountId),
      },
    },
    success_url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/payment/success"
        : "https://cornucopia.vercel.app/payment/success",
    cancel_url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/payment/cancel"
        : "https://cornucopia.vercel.app/payment/cancel",
  };

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return redirect(session.url as string);
}

export async function CreateStripeAccoutnLink() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error();
  }

  const data = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      connectedAccountId: true,
    },
  });

  if (!data?.connectedAccountId) {
    throw new Error("Connected account ID not found");
  }

  const accountLink = await stripe.accountLinks.create({
    account: asStripeAccountId(data.connectedAccountId),
    refresh_url:
      process.env.NODE_ENV === "development"
        ? `http://localhost:3000/billing`
        : `https://cornucopia.vercel.app/billing`,
    return_url:
      process.env.NODE_ENV === "development"
        ? `http://localhost:3000/return/${data.connectedAccountId}`
        : `https://cornucopia.vercel.app/return/${data.connectedAccountId}`,
    type: "account_onboarding",
  });

  return redirect(accountLink.url);
}

export async function UpdateMarketStand(prevState: any, formData: FormData): Promise<{ error?: string } | Response> {
  console.log('UpdateMarketStand called with formData:', Object.fromEntries(formData.entries()));
  
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  console.log('Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email
  });

  if (!user) {
    return { error: "Not authenticated" };
  }

  const marketStandId = formData.get("id")?.toString();
  console.log('Market stand ID from form:', marketStandId);
  
  if (!marketStandId) {
    return { error: "Market stand ID is required" };
  }

  try {
    // Debug database connection first
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection verified');

    // Raw SQL check for market stand
    const rawCheck = await prisma.$queryRaw`
      SELECT id, "userId"
      FROM "MarketStand"
      WHERE id = ${marketStandId}
    `;
    console.log('Raw market stand check:', rawCheck);

    // Verify ownership with detailed query
    const existingStand = await prisma.marketStand.findUnique({
      where: {
        id: marketStandId,
        userId: user.id
      },
      select: {
        id: true,
        userId: true,
        name: true
      }
    });

    console.log('Ownership check:', {
      found: !!existingStand,
      marketStandId,
      userId: user.id,
      standUserId: existingStand?.userId,
      isOwner: existingStand?.userId === user.id
    });

    if (!existingStand) {
      return { error: "Market stand not found or you don't have permission to edit it" };
    }

    // Parse and validate form data
    const rawImages = formData.get("images");
    const rawFormData = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      images: rawImages ? JSON.parse(rawImages.toString()) : [],
      locationName: formData.get("locationName")?.toString() ?? "",
      locationGuide: formData.get("locationGuide")?.toString() ?? "",
      latitude: formData.get("latitude")?.toString() ?? "0",
      longitude: formData.get("longitude")?.toString() ?? "0",
      userId: user.id
    };

    console.log('Parsed form data:', rawFormData);

    // Validate data
    const marketStandData = validateMarketStandData(rawFormData);
    console.log('Validated data:', marketStandData);

    // Build update data object
    const updateData: any = {};
    const modifiedFields = new Set<string>();
    
    if (formData.get("name")) {
      updateData.name = formData.get("name");
      modifiedFields.add('name');
    }
    if (formData.get("description")) {
      updateData.description = formData.get("description");
      modifiedFields.add('description');
    }
    if (formData.get("locationName")) {
      updateData.locationName = formData.get("locationName");
      modifiedFields.add('locationName');
    }
    if (formData.get("locationGuide")) {
      updateData.locationGuide = formData.get("locationGuide");
      modifiedFields.add('locationGuide');
    }
    if (formData.get("images")) {
      updateData.images = JSON.parse(formData.get("images") as string);
      modifiedFields.add('images');
    }
    if (formData.get("latitude")) {
      updateData.latitude = parseFloat(formData.get("latitude") as string);
      modifiedFields.add('latitude');
    }
    if (formData.get("longitude")) {
      updateData.longitude = parseFloat(formData.get("longitude") as string);
      modifiedFields.add('longitude');
    }

    console.log('Update operation:', {
      where: { id: marketStandId, userId: user.id },
      data: updateData,
      modifiedFields: Array.from(modifiedFields)
    });

    // Perform update
    const marketStand = await prisma.marketStand.update({
      where: {
        id: marketStandId,
        userId: user.id
      },
      data: updateData
    });

    console.log('Update result:', marketStand);

    // Redirect on success
    const redirectUrl = `/market-stand/${marketStandId}`; // Use raw ID for consistency
    console.log('Redirecting to:', redirectUrl);
    return redirect(redirectUrl);
  } catch (error) {
    console.error('Market stand update error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update market stand. Please try again." };
  }
}

export async function CreateMarketStand(prevState: any, formData: FormData): Promise<{ error?: string } | Response> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Extract and validate form data
  const rawImages = formData.get("images");

  try {
    // Parse and validate form data
    const rawFormData = {
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      images: rawImages ? JSON.parse(rawImages.toString()) : [],
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
          firstName: user.given_name ?? '',
          lastName: user.family_name ?? '',
          profileImage: user.picture ?? '',
          // connectedAccountId is now optional, so we don't need to set it
          stripeConnectedLinked: false
        }
      });
    }

    // First check if user already has a market stand
    const existingStand = await prisma.marketStand.findUnique({
      where: {
        userId: user.id
      }
    });

    if (existingStand) {
      return { error: "You already have a market stand" };
    }

    // Create the market stand
    const marketStand = await prisma.marketStand.create({
      data: marketStandData
    });

    if (!marketStand) {
      return { error: "Failed to create market stand" };
    }

    return redirect("/sell");
  } catch (error) {
    console.error('Market stand creation error:', error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create market stand. Please try again." };
  }
}

export async function GetStripeDashboardLink() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    throw new Error();
  }

  const data = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      connectedAccountId: true,
    },
  });

  if (!data?.connectedAccountId) {
    throw new Error("Connected account ID not found");
  }

  // Create login link for the connected account
  const loginLink = await stripe.accounts.createLoginLink(
    asStripeAccountId(data.connectedAccountId)
  );

  return redirect(loginLink.url);
}
