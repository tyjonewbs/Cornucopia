import { NextRequest, NextResponse } from "next/server";
import prisma from "lib/db";
import { 
  MarketStandDetailResponse,
  ErrorResponse, 
  detailViewSelect,
  DetailedProduct,
  ValidationErrorResponse 
} from "../types";
import { 
  createErrorResponse, 
  validateMarketStandId
} from "../utils";
import { Prisma } from "@prisma/client";
import { safeValidateMarketStandInput } from "../validation";

// Type for raw Prisma response
type PrismaMarketStand = Prisma.MarketStandGetPayload<{
  select: typeof detailViewSelect;
}>;

/**
 * Transforms a Prisma product to match our API response type
 */
function transformProduct(product: PrismaMarketStand["products"][0]): DetailedProduct {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    inventoryUpdatedAt: product.inventoryUpdatedAt?.toISOString() ?? null,
    status: product.status.toString(),
  };
}

/**
 * Transforms Prisma response to match our API response type
 */
function transformMarketStandResponse(
  stand: PrismaMarketStand
): MarketStandDetailResponse {
  return {
    ...stand,
    createdAt: stand.createdAt.toISOString(),
    products: stand.products.map(transformProduct),
    user: {
      id: stand.user.id,
      firstName: stand.user.firstName,
      lastName: stand.user.lastName,
      profileImage: stand.user.profileImage
    }
  };
}

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
const { id } = params;

  try {
    const marketStand = await prisma.marketStand.findUnique({
      where: { id },
      select: detailViewSelect
    });

    if (!marketStand) {
      return new NextResponse(
        JSON.stringify({ error: "Market stand not found" }), 
        { status: 404 }
      );
    }

    const response = transformMarketStandResponse(marketStand);
    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error);
  }
};

/**
 * Updates a market stand by ID
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<MarketStandDetailResponse | ErrorResponse | ValidationErrorResponse>> {
  try {
    // Validate ID format
    if (!validateMarketStandId(params.id)) {
      throw new Error("Invalid market stand ID format");
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = safeValidateMarketStandInput(body);
    
    if (!validationResult.success) {
      const validationError: ValidationErrorResponse = {
        error: "Validation error",
        details: validationResult.error.formErrors
      };
      return NextResponse.json(validationError, { status: 400 });
    }

    // Update market stand with validated data
    const updatedStand = await prisma.marketStand.update({
      where: { id: params.id },
      data: {
        name: validationResult.data.name,
        description: validationResult.data.description,
        images: validationResult.data.images,
        latitude: validationResult.data.latitude,
        longitude: validationResult.data.longitude,
        locationName: validationResult.data.locationName,
        locationGuide: validationResult.data.locationGuide,
        tags: validationResult.data.tags
      },
      select: detailViewSelect
    });

    // Transform and return response
    return NextResponse.json(transformMarketStandResponse(updatedStand));
  } catch (error) {
    return createErrorResponse(error);
  }
}

export const DELETE = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
const { id } = params;

  try {
    await prisma.marketStand.delete({
      where: { id }
    });
 
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
 };
