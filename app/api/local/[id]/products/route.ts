import { NextResponse } from "next/server";
import { getLocalProducts } from "@/app/actions/local-products";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getLocalProducts(params.id);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch local products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local products' },
      { status: 500 }
    );
  }
}
