import { NextResponse } from "next/server";
import prisma, { executeWithRetry } from "lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { 
  MarketStandListResponse,
  ErrorResponse, 
  listViewSelect,
  MarketStandProduct,
  ValidationErrorResponse 
} from "./types";
import { 
  createErrorResponse, 
  withErrorHandling 
} from "./utils";
import { Prisma } from "@prisma/client";
import { safeValidateMarketStandInput } from "./validation";

// Type for raw Prisma response
type PrismaMarketStand = Prisma.MarketStandGetPayload<{
  select: typeof listViewSelect;
}>;

/**
 * Transforms a Prisma product to match our API response type
 */
function transformProduct(product: PrismaMarketStand["products"][0]): MarketStandProduct {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

/**
 * Transforms Prisma response to match our API response type
 */
function transformMarketStandResponse(
  stand: PrismaMarketStand
): MarketStandListResponse {
  return {
    ...stand,
    createdAt: stand.createdAt.toISOString(),
    products: stand.products.map(transformProduct),
    user: {
      firstName: stand.user.firstName,
      profileImage: stand.user.profileImage
    }
  };
}

/**
 * Fetches a list of market stands with their associated products and user information
 */
export async function GET(): Promise<NextResponse<MarketStandListResponse[] | ErrorResponse>> {
  noStore();
  return withErrorHandling<MarketStandListResponse[]>(async () => {
    // Use executeWithRetry for the database query
    const marketStands = await executeWithRetry(async () => {
      return prisma.marketStand.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc"
        },
        select: listViewSelect
      });
    }, 2); // Allow up to 2 retries

    if (!marketStands) {
      throw new Error("Failed to fetch market stands");
    }

    // Transform response
    const response = marketStands.map(transformMarketStandResponse);
    return NextResponse.json(response);
  });
}

/**
 * Creates a new market stand
 */
export async function POST(
  request: Request
): Promise<NextResponse<MarketStandListResponse | ErrorResponse | ValidationErrorResponse>> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = safeValidateMarketStandInput(body);
    if (!validationResult.success) {
      const validationError: ValidationErrorResponse = {
        error: "Validation error",
        details: validationResult.error.formErrors
      };
      return NextResponse.json(validationError, { status: 400 });
    }

    // Check if user already has a market stand using executeWithRetry
    const existingStand = await executeWithRetry(async () => {
      return prisma.marketStand.findFirst({
        where: {
          userId: validationResult.data.userId,
          isActive: true
        }
      });
    });

    if (existingStand) {
      return NextResponse.json(
        { error: "You already have an active market stand" },
        { status: 400 }
      );
    }

    // Create market stand with validated data using executeWithRetry
    const newStand = await executeWithRetry(async () => {
      return prisma.marketStand.create({
        data: {
          name: validationResult.data.name,
          description: validationResult.data.description,
          images: validationResult.data.images,
          latitude: validationResult.data.latitude,
          longitude: validationResult.data.longitude,
          locationName: validationResult.data.locationName,
          locationGuide: validationResult.data.locationGuide,
          tags: validationResult.data.tags,
          website: validationResult.data.website,
          socialMedia: validationResult.data.socialMedia,
          userId: validationResult.data.userId
        },
        select: listViewSelect
      });
    });

    // Transform and return response
    return NextResponse.json(transformMarketStandResponse(newStand));
  } catch (error) {
    return createErrorResponse(error);
  }
}
