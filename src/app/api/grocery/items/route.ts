import { NextResponse } from "next/server";
import {
  getOrCreateGroceryList,
  addItemsToGroceryList,
} from "@/lib/db/queries";
import { emitGroceryEvent } from "@/lib/grocery-events";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items: { item: string; quantity: number; unit: string }[];
      weekOf?: string;
    };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const groceryList = await getOrCreateGroceryList(body.weekOf);
    const { inserted, mergedCount } = await addItemsToGroceryList(
      groceryList.id,
      body.items
    );

    if (inserted.length > 0) {
      emitGroceryEvent({ type: "add", items: inserted });
    }

    return NextResponse.json({
      added: inserted.length,
      merged: mergedCount,
    });
  } catch (error) {
    console.error("Failed to add grocery items:", error);
    return NextResponse.json(
      { error: "Failed to add items" },
      { status: 500 }
    );
  }
}
