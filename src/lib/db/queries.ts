import { db } from ".";
import {
  mealPlans,
  recipes,
  savedRecipes,
  groceryLists,
  groceryItems,
} from "./schema";
import { eq, desc, sql } from "drizzle-orm";

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

export async function getCurrentMealPlan() {
  const weekOf = getCurrentWeekMonday();
  return getMealPlanByWeek(weekOf);
}

export async function getMealPlanByWeek(weekOf: string) {
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
  const targetWeek = weekOf ?? getCurrentWeekMonday();

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.weekOf, targetWeek))
    .limit(1);

  if (!plan) return null;

  const [list] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.mealPlanId, plan.id))
    .limit(1);

  if (!list) return null;

  const items = await db
    .select()
    .from(groceryItems)
    .where(eq(groceryItems.groceryListId, list.id))
    .orderBy(groceryItems.sortOrder);

  return { ...list, items, weekOf: targetWeek };
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

export async function getWeeksList() {
  const weeks = await db
    .select({ weekOf: mealPlans.weekOf, id: mealPlans.id })
    .from(mealPlans)
    .orderBy(desc(mealPlans.weekOf))
    .limit(12);

  return weeks;
}

export async function getMostRecentMealPlan() {
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
