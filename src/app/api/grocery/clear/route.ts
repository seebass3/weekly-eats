import { NextResponse } from "next/server";
import { getGroceryListForWeek, clearGroceryList } from "@/lib/db/queries";
import { emitGroceryEvent } from "@/lib/grocery-events";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      weekOf?: string;
    };

    const groceryList = await getGroceryListForWeek(body.weekOf);

    if (!groceryList) {
      return NextResponse.json(
        { error: "No grocery list found" },
        { status: 404 }
      );
    }

    const cleared = await clearGroceryList(groceryList.id);

    emitGroceryEvent({ type: "clear" });

    return NextResponse.json({ cleared });
  } catch (error) {
    console.error("Failed to clear grocery list:", error);
    return NextResponse.json(
      { error: "Failed to clear list" },
      { status: 500 }
    );
  }
}
