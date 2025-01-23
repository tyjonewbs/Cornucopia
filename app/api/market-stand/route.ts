import { NextResponse } from "next/server";
import prisma from "lib/db";
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
  serializeDates, 
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
  console.log("Market stands API route called");

  return withErrorHandling<MarketStandListResponse[]>(async () => {
    try {

      // Fetch market stands with related data
      const marketStands = await prisma.marketStand.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc"
        },
        select: listViewSelect
      });

      if (!marketStands) {
        throw new Error("Failed to fetch market stands");
      }

      // Transform and log response
      const response = marketStands.map(transformMarketStandResponse);
      console.log("Successfully fetched market stands:", {
        count: response.length,
        hasData: response.length > 0
      });

      return NextResponse.json(response);
    } catch (error) {
      // If we get a connection error, try to reconnect
      if (error instanceof Error && error.message.includes('prepared statement')) {
        
        // Retry the query
        const marketStands = await prisma.marketStand.findMany({
          take: 10,
          orderBy: {
            createdAt: "desc"
          },
          select: listViewSelect
        });

        const response = marketStands.map(transformMarketStandResponse);
        return NextResponse.json(response);
      }
      throw error;
    }
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

    // Check if user already has a market stand
    const existingStand = await prisma.marketStand.findFirst({
      where: {
        userId: validationResult.data.userId,
        isActive: true
      }
    });

    if (existingStand) {
      return NextResponse.json(
        { error: "You already have an active market stand" },
        { status: 400 }
      );
    }

    // Create market stand with validated data
    const newStand = await prisma.marketStand.create({
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

    // Transform and return response
    return NextResponse.json(transformMarketStandResponse(newStand));
  } catch (error) {
    // If we get a connection error, try to reconnect
    return createErrorResponse(error);
    return createErrorResponse(error);
  }
}
