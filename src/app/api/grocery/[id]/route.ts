import { NextResponse } from "next/server";
import { toggleGroceryItem, removeGroceryItem } from "@/lib/db/queries";
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const deleted = await removeGroceryItem(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Grocery item not found" },
        { status: 404 }
      );
    }

    emitGroceryEvent({ type: "remove", itemId: deleted.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove grocery item:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
