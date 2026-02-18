import { db } from ".";
import {
  mealPlans,
  recipes,
  savedRecipes,
  groceryLists,
  groceryItems,
} from "./schema";
import { eq, desc, sql } from "drizzle-orm";
import {
  normalizeItemName,
  normalizeUnit,
  categorizeItem,
} from "@/lib/ingredient-utils";
import { getCurrentWeekMonday } from "@/lib/dates";
import { cacheTag } from "next/cache";

export async function getCurrentMealPlan() {
  const weekOf = getCurrentWeekMonday();
  return getMealPlanByWeek(weekOf);
}

export async function getMealPlanByWeek(weekOf: string) {
  "use cache";
  cacheTag("meals", `meals-${weekOf}`);

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.weekOf, weekOf))
    .limit(1);

  if (!plan) return null;

  const planRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.mealPlanId, plan.id))
    .orderBy(recipes.dayOfWeek);

  return { ...plan, recipes: planRecipes };
}

export async function getRecipeById(id: string) {
  "use cache";
  cacheTag("meals", `recipe-${id}`);

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipe) return null;

  // Check if it's a favorite
  const [favorite] = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.recipeId, id))
    .limit(1);

  return { ...recipe, isFavorite: !!favorite };
}

export async function getGroceryListForWeek(weekOf?: string) {
  "use cache";
  cacheTag("grocery");

  const targetWeek = weekOf ?? getCurrentWeekMonday();

  const [list] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.weekOf, targetWeek))
    .limit(1);

  if (!list) return null;

  const items = await db
    .select()
    .from(groceryItems)
    .where(eq(groceryItems.groceryListId, list.id))
    .orderBy(groceryItems.sortOrder);

  return { ...list, items, weekOf: targetWeek };
}

export async function getOrCreateGroceryList(weekOf?: string) {
  const targetWeek = weekOf ?? getCurrentWeekMonday();

  const [existing] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.weekOf, targetWeek))
    .limit(1);

  if (existing) return existing;

  // Check if there's a meal plan for this week to link
  const [plan] = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(eq(mealPlans.weekOf, targetWeek))
    .limit(1);

  const [created] = await db
    .insert(groceryLists)
    .values({
      mealPlanId: plan?.id ?? null,
      weekOf: targetWeek,
    })
    .returning();

  return created;
}

export async function addItemsToGroceryList(
  groceryListId: string,
  newItems: { item: string; quantity: number; unit: string }[]
) {
  // Fetch existing items for dedup
  const existingItems = await db
    .select()
    .from(groceryItems)
    .where(eq(groceryItems.groceryListId, groceryListId));

  // Build lookup map: normalizedName|normalizedUnit -> existing item
  const existingMap = new Map<string, (typeof existingItems)[number]>();
  for (const item of existingItems) {
    const key = `${normalizeItemName(item.item)}|${item.unit}`;
    existingMap.set(key, item);
  }

  const toInsert: {
    item: string;
    quantity: string;
    unit: string;
    category: string;
    sortOrder: number;
  }[] = [];
  let mergedCount = 0;
  const maxSortOrder = existingItems.reduce(
    (max, i) => Math.max(max, i.sortOrder),
    -1
  );

  for (const newItem of newItems) {
    const normalizedName = normalizeItemName(newItem.item);
    const normalizedUnitVal = normalizeUnit(newItem.unit);
    const key = `${normalizedName}|${normalizedUnitVal}`;

    const existing = existingMap.get(key);
    if (existing) {
      // Merge: add quantities
      const newQty = parseFloat(existing.quantity) + newItem.quantity;
      await db
        .update(groceryItems)
        .set({ quantity: newQty.toString() })
        .where(eq(groceryItems.id, existing.id));
      mergedCount++;
    } else {
      const category = categorizeItem(newItem.item) ?? "other";
      toInsert.push({
        item: normalizedName,
        quantity: newItem.quantity.toString(),
        unit: normalizedUnitVal,
        category,
        sortOrder: maxSortOrder + 1 + toInsert.length,
      });
    }
  }

  let inserted: (typeof groceryItems.$inferSelect)[] = [];
  if (toInsert.length > 0) {
    inserted = await db
      .insert(groceryItems)
      .values(
        toInsert.map((item) => ({
          groceryListId,
          ...item,
        }))
      )
      .returning();
  }

  return { inserted, mergedCount };
}

export async function removeGroceryItem(id: string) {
  const [deleted] = await db
    .delete(groceryItems)
    .where(eq(groceryItems.id, id))
    .returning();

  return deleted ?? null;
}

export async function clearGroceryList(groceryListId: string) {
  const result = await db
    .delete(groceryItems)
    .where(eq(groceryItems.groceryListId, groceryListId))
    .returning({ id: groceryItems.id });

  return result.length;
}

export async function toggleGroceryItem(id: string) {
  const [item] = await db
    .select()
    .from(groceryItems)
    .where(eq(groceryItems.id, id))
    .limit(1);

  if (!item) return null;

  const newChecked = !item.checked;
  const [updated] = await db
    .update(groceryItems)
    .set({
      checked: newChecked,
      checkedAt: newChecked ? new Date() : null,
    })
    .where(eq(groceryItems.id, id))
    .returning();

  return updated;
}

export async function toggleFavorite(recipeId: string) {
  const [existing] = await db
    .select()
    .from(savedRecipes)
    .where(eq(savedRecipes.recipeId, recipeId))
    .limit(1);

  if (existing) {
    await db
      .delete(savedRecipes)
      .where(eq(savedRecipes.recipeId, recipeId));
    return { isFavorite: false };
  }

  await db.insert(savedRecipes).values({ recipeId });
  return { isFavorite: true };
}

export async function getFavorites() {
  "use cache";
  cacheTag("favorites");

  const favorites = await db
    .select({
      savedRecipe: savedRecipes,
      recipe: recipes,
    })
    .from(savedRecipes)
    .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
    .orderBy(desc(savedRecipes.savedAt));

  return favorites.map((f) => ({
    ...f.recipe,
    savedAt: f.savedRecipe.savedAt,
    timesUsed: f.savedRecipe.timesUsed,
    lastUsedAt: f.savedRecipe.lastUsedAt,
  }));
}

export async function getMostRecentMealPlan() {
  "use cache";
  cacheTag("meals");

  const [plan] = await db
    .select()
    .from(mealPlans)
    .orderBy(desc(mealPlans.weekOf))
    .limit(1);

  if (!plan) return null;

  const planRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.mealPlanId, plan.id))
    .orderBy(recipes.dayOfWeek);

  return { ...plan, recipes: planRecipes };
}
