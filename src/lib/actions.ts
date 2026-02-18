"use server";

import { updateTag } from "next/cache";
import {
  toggleGroceryItem,
  removeGroceryItem,
  clearGroceryList,
  getOrCreateGroceryList,
  addItemsToGroceryList,
  getGroceryListForWeek,
  toggleFavorite,
} from "@/lib/db/queries";
import { emitGroceryEvent } from "@/lib/grocery-events";

export async function toggleGroceryItemAction(id: string) {
  const updated = await toggleGroceryItem(id);
  if (!updated) return { error: "Item not found" as const };

  emitGroceryEvent({
    type: "toggle",
    itemId: updated.id,
    checked: updated.checked,
  });

  updateTag("grocery");
  return { checked: updated.checked };
}

export async function removeGroceryItemAction(id: string) {
  const deleted = await removeGroceryItem(id);
  if (!deleted) return { error: "Item not found" as const };

  emitGroceryEvent({ type: "remove", itemId: deleted.id });

  updateTag("grocery");
  return { success: true as const };
}

export async function clearGroceryListAction(weekOf?: string) {
  const groceryList = await getGroceryListForWeek(weekOf);
  if (!groceryList) return { error: "No grocery list found" as const };

  const cleared = await clearGroceryList(groceryList.id);

  emitGroceryEvent({ type: "clear" });

  updateTag("grocery");
  return { cleared };
}

export async function addGroceryItemsAction(
  items: { item: string; quantity: number; unit: string }[],
  weekOf?: string
) {
  if (!items || items.length === 0) return { error: "No items" as const };

  const groceryList = await getOrCreateGroceryList(weekOf);
  const { inserted, mergedCount } = await addItemsToGroceryList(
    groceryList.id,
    items
  );

  if (inserted.length > 0) {
    emitGroceryEvent({ type: "add", items: inserted });
  }

  updateTag("grocery");
  return { added: inserted.length, merged: mergedCount };
}

export async function toggleFavoriteAction(recipeId: string) {
  const result = await toggleFavorite(recipeId);

  updateTag("favorites");
  updateTag(`recipe-${recipeId}`);

  return result;
}
