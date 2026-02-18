import { db } from "@/lib/db";
import {
  mealPlans,
  recipes,
  savedRecipes,
  groceryLists,
  groceryItems,
} from "@/lib/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";
import { generateJSON } from "./client";
import {
  SYSTEM_PROMPT,
  buildRecipePrompt,
  buildSingleRecipePrompt,
} from "./prompts";
import { RecipeSchema, type GeneratedRecipe } from "./schema";
import { generateGroceryList } from "./generate-grocery";
import { getCurrentWeekMonday, getNextMonday } from "@/lib/dates";

async function getRecentRecipeNames(weeksBack: number): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);

  const recent = await db
    .select({ name: recipes.name })
    .from(recipes)
    .where(gte(recipes.createdAt, cutoff))
    .orderBy(desc(recipes.createdAt))
    .limit(weeksBack * 5);

  return recent.map((r) => r.name);
}

async function getFavoriteNames(): Promise<string[]> {
  const favorites = await db
    .select({ name: recipes.name })
    .from(savedRecipes)
    .innerJoin(recipes, sql`${savedRecipes.recipeId} = ${recipes.id}`)
    .limit(20);

  return favorites.map((r) => r.name);
}

async function generateSingleRecipe(
  dayIndex: number,
  previousRecipes: string[],
  recentWeeksRecipes: string[],
  favoriteNames: string[],
  context?: string,
  maxRetries: number = 2
): Promise<GeneratedRecipe> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await generateJSON<unknown>({
        system: SYSTEM_PROMPT,
        prompt: buildRecipePrompt({
          dayIndex,
          previousRecipes,
          recentWeeksRecipes,
          favoriteNames,
          context,
        }),
      });

      return RecipeSchema.parse(raw);
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to generate recipe for day ${dayIndex + 1} after ${maxRetries + 1} attempts: ${error}`
        );
      }
      console.warn(
        `Recipe generation attempt ${attempt + 1} failed, retrying...`,
        error
      );
    }
  }

  throw new Error("Unreachable");
}

async function deleteMealPlanForWeek(weekOf: string) {
  const [plan] = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(eq(mealPlans.weekOf, weekOf))
    .limit(1);

  if (!plan) return;

  // Cascade deletes handle recipes, saved_recipes, grocery_lists, grocery_items
  await db.delete(mealPlans).where(eq(mealPlans.id, plan.id));
}

export async function generateWeeklyPlan(options?: {
  weekOf?: string;
  force?: boolean;
  context?: string;
}) {
  const { weekOf, force, context } = options ?? {};
  const targetWeek = weekOf ?? getNextMonday();

  // Check if plan already exists for this week
  const existing = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(sql`${mealPlans.weekOf} = ${targetWeek}`)
    .limit(1);

  if (existing.length > 0) {
    if (force) {
      await deleteMealPlanForWeek(targetWeek);
    } else {
      return { mealPlanId: existing[0].id, alreadyExisted: true };
    }
  }

  const recentWeeksRecipes = await getRecentRecipeNames(3);
  const favoriteNames = await getFavoriteNames();

  // Generate 5 recipes sequentially
  const generatedRecipes: GeneratedRecipe[] = [];
  for (let i = 0; i < 5; i++) {
    const recipe = await generateSingleRecipe(
      i,
      generatedRecipes.map((r) => r.name),
      recentWeeksRecipes,
      favoriteNames,
      context
    );
    generatedRecipes.push(recipe);
    console.log(`Generated recipe ${i + 1}/5: ${recipe.name}`);
  }

  // Insert meal plan and recipes
  const [mealPlan] = await db
    .insert(mealPlans)
    .values({ weekOf: targetWeek, generatedBy: "auto" })
    .returning({ id: mealPlans.id });

  const insertedRecipes = await db
    .insert(recipes)
    .values(
      generatedRecipes.map((recipe, index) => ({
        mealPlanId: mealPlan.id,
        name: recipe.name,
        cuisine: recipe.cuisine,
        dayOfWeek: (index + 1) as 1 | 2 | 3 | 4 | 5,
        cookTimeMinutes: recipe.cook_time_minutes,
        prepTimeMinutes: recipe.prep_time_minutes,
        servings: recipe.servings,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tags: recipe.tags,
        source: "generated",
      }))
    )
    .returning();

  // Generate grocery list from the recipes
  await generateGroceryList(mealPlan.id, targetWeek, insertedRecipes);

  return { mealPlanId: mealPlan.id, alreadyExisted: false, insertedRecipes };
}

export async function regenerateSingleRecipe(
  recipeId: string,
  context?: string
) {
  // Find the existing recipe and its meal plan
  const [existingRecipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!existingRecipe || !existingRecipe.mealPlanId) {
    throw new Error("Recipe not found or not part of a meal plan");
  }

  // Get the meal plan's weekOf
  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(eq(mealPlans.id, existingRecipe.mealPlanId))
    .limit(1);

  if (!plan) throw new Error("Meal plan not found");

  // Get other recipes in the same plan
  const otherRecipes = await db
    .select({ name: recipes.name })
    .from(recipes)
    .where(eq(recipes.mealPlanId, plan.id));

  const otherNames = otherRecipes
    .filter((r) => r.name !== existingRecipe.name)
    .map((r) => r.name);

  const recentWeeksRecipes = await getRecentRecipeNames(3);
  const favoriteNames = await getFavoriteNames();

  const dayIndex = (existingRecipe.dayOfWeek ?? 1) - 1;

  // Generate replacement recipe
  let newRecipe: GeneratedRecipe | null = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const raw = await generateJSON<unknown>({
        system: SYSTEM_PROMPT,
        prompt: buildSingleRecipePrompt({
          dayIndex,
          otherRecipes: otherNames,
          recentWeeksRecipes,
          favoriteNames,
          context,
        }),
      });
      newRecipe = RecipeSchema.parse(raw);
      break;
    } catch (error) {
      if (attempt === 2) {
        throw new Error(`Failed to regenerate recipe after 3 attempts: ${error}`);
      }
      console.warn(`Regeneration attempt ${attempt + 1} failed, retrying...`);
    }
  }

  if (!newRecipe) throw new Error("Unreachable");

  // Update the recipe in-place
  const [updated] = await db
    .update(recipes)
    .set({
      name: newRecipe.name,
      cuisine: newRecipe.cuisine,
      cookTimeMinutes: newRecipe.cook_time_minutes,
      prepTimeMinutes: newRecipe.prep_time_minutes,
      servings: newRecipe.servings,
      description: newRecipe.description,
      ingredients: newRecipe.ingredients,
      steps: newRecipe.steps,
      tags: newRecipe.tags,
    })
    .where(eq(recipes.id, recipeId))
    .returning();

  // Regenerate the grocery list for this week
  const allRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.mealPlanId, plan.id));

  // Delete existing grocery list for this plan (cascade deletes items)
  await db
    .delete(groceryLists)
    .where(eq(groceryLists.mealPlanId, plan.id));

  await generateGroceryList(plan.id, plan.weekOf, allRecipes);

  return updated;
}
