import { NextResponse } from "next/server";
import { toggleGroceryItem } from "@/lib/db/queries";
import { emitGroceryEvent } from "@/lib/grocery-events";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const updated = await toggleGroceryItem(id);

    if (!updated) {
      return NextResponse.json(
        { error: "Grocery item not found" },
        { status: 404 }
      );
    }

    // Emit SSE event for real-time sync
    emitGroceryEvent({
      type: "toggle",
      itemId: updated.id,
      checked: updated.checked,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to toggle grocery item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
