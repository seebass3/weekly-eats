import { db } from "@/lib/db";
import { mealPlans, recipes, savedRecipes } from "@/lib/db/schema";
import { desc, gte, sql } from "drizzle-orm";
import { generateJSON } from "./client";
import { SYSTEM_PROMPT, buildRecipePrompt } from "./prompts";
import { RecipeSchema, type GeneratedRecipe } from "./schema";
import { generateGroceryList } from "./generate-grocery";

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  return monday.toISOString().split("T")[0];
}

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

export async function generateWeeklyPlan(weekOf?: string) {
  const targetWeek = weekOf ?? getNextMonday();

  // Check if plan already exists for this week
  const existing = await db
    .select({ id: mealPlans.id })
    .from(mealPlans)
    .where(sql`${mealPlans.weekOf} = ${targetWeek}`)
    .limit(1);

  if (existing.length > 0) {
    return { mealPlanId: existing[0].id, alreadyExisted: true };
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
      favoriteNames
    );
    generatedRecipes.push(recipe);
    console.log(`Generated recipe ${i + 1}/5: ${recipe.name}`);
  }

  // Insert meal plan and recipes in a transaction
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
  await generateGroceryList(mealPlan.id, insertedRecipes);

  return { mealPlanId: mealPlan.id, alreadyExisted: false, insertedRecipes };
}
