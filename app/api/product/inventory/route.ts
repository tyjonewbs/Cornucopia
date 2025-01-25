import { NextResponse } from "next/server";
import { UpdateInventory } from "@/app/actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await UpdateInventory({ status: undefined, message: null }, formData);
    
    if (!result.ok) {
      const data = await result.json();
      return NextResponse.json({ error: data.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { 
        error: "Failed to update inventory",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
