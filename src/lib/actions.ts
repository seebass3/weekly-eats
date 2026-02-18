"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/db";
import { recipes, savedRecipes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  toggleGroceryItem,
  removeGroceryItem,
  clearGroceryList,
  getOrCreateGroceryList,
  addItemsToGroceryList,
  getGroceryListForWeek,
  toggleFavorite,
} from "@/lib/db/queries";
import { emitSyncEvent } from "@/lib/sync-events";

export async function toggleGroceryItemAction(id: string) {
  const updated = await toggleGroceryItem(id);
  if (!updated) return { error: "Item not found" as const };

  emitSyncEvent({
    type: "grocery:toggle",
    itemId: updated.id,
    checked: updated.checked,
  });

  updateTag("grocery");
  return { checked: updated.checked };
}

export async function removeGroceryItemAction(id: string) {
  const deleted = await removeGroceryItem(id);
  if (!deleted) return { error: "Item not found" as const };

  emitSyncEvent({ type: "grocery:remove", itemId: deleted.id });

  updateTag("grocery");
  return { success: true as const };
}

export async function clearGroceryListAction(weekOf?: string) {
  const groceryList = await getGroceryListForWeek(weekOf);
  if (!groceryList) return { error: "No grocery list found" as const };

  const cleared = await clearGroceryList(groceryList.id);

  emitSyncEvent({ type: "grocery:clear" });

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

  emitSyncEvent({ type: "grocery:add", items: inserted });

  updateTag("grocery");
  return { added: inserted.length, merged: mergedCount };
}

export async function emitGenerationStart(weekOf: string) {
  emitSyncEvent({ type: "generation:start", weekOf });
}

export async function emitGenerationEnd() {
  emitSyncEvent({ type: "generation:end" });
}

export async function emitSwapStart(recipeId: string) {
  emitSyncEvent({ type: "swap:start", recipeId });
}

export async function emitSwapEnd(recipeId: string) {
  emitSyncEvent({ type: "swap:end", recipeId });
}

export async function replaceWithFavoriteAction(
  recipeId: string,
  favoriteRecipeId: string
) {
  // Fetch the favorite recipe's full data
  const [source] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, favoriteRecipeId))
    .limit(1);

  if (!source) return { error: "Favorite recipe not found" as const };

  // Copy fields into the target recipe (keeps same id + mealPlanId)
  const [updated] = await db
    .update(recipes)
    .set({
      name: source.name,
      cuisine: source.cuisine,
      cookTimeMinutes: source.cookTimeMinutes,
      prepTimeMinutes: source.prepTimeMinutes,
      servings: source.servings,
      description: source.description,
      ingredients: source.ingredients,
      steps: source.steps,
      tags: source.tags,
      source: "favorite",
    })
    .where(eq(recipes.id, recipeId))
    .returning();

  if (!updated) return { error: "Target recipe not found" as const };

  // Track usage on the saved recipe
  const [saved] = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.recipeId, favoriteRecipeId))
    .limit(1);

  if (saved) {
    await db
      .update(savedRecipes)
      .set({
        timesUsed: saved.timesUsed + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(savedRecipes.id, saved.id));
  }

  emitSyncEvent({ type: "meals:updated" });
  updateTag("meals");
  updateTag(`recipe-${recipeId}`);

  return { success: true as const, recipe: updated };
}

export async function swapRecipeDaysAction(
  recipeIdA: string,
  recipeIdB: string
) {
  const [recipeA] = await db
    .select({ id: recipes.id, dayOfWeek: recipes.dayOfWeek })
    .from(recipes)
    .where(eq(recipes.id, recipeIdA))
    .limit(1);

  const [recipeB] = await db
    .select({ id: recipes.id, dayOfWeek: recipes.dayOfWeek })
    .from(recipes)
    .where(eq(recipes.id, recipeIdB))
    .limit(1);

  if (!recipeA || !recipeB) return { error: "Recipe not found" as const };
  if (recipeA.dayOfWeek === null || recipeB.dayOfWeek === null) {
    return { error: "Recipe has no day assignment" as const };
  }

  await db
    .update(recipes)
    .set({ dayOfWeek: recipeB.dayOfWeek })
    .where(eq(recipes.id, recipeIdA));

  await db
    .update(recipes)
    .set({ dayOfWeek: recipeA.dayOfWeek })
    .where(eq(recipes.id, recipeIdB));

  emitSyncEvent({ type: "meals:updated" });
  updateTag("meals");

  return { success: true as const };
}

export async function toggleFavoriteAction(recipeId: string) {
  const result = await toggleFavorite(recipeId);

  emitSyncEvent({ type: "favorites:updated" });

  updateTag("favorites");
  updateTag(`recipe-${recipeId}`);

  return result;
}
