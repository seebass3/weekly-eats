import { db } from "@/lib/db";
import {
  groceryLists,
  groceryItems,
  type recipes as recipesTable,
} from "@/lib/db/schema";
import { generateJSON } from "./client";
import { SYSTEM_PROMPT, buildGroceryCategoryPrompt } from "./prompts";
import {
  normalizeItemName,
  normalizeUnit,
  categorizeItem,
  CATEGORY_ORDER,
} from "@/lib/ingredient-utils";

type Recipe = typeof recipesTable.$inferSelect;

interface MergedItem {
  item: string;
  quantity: number;
  unit: string;
  category: string;
}

function mergeIngredients(
  allRecipes: Recipe[]
): Map<string, { quantity: number; unit: string }> {
  const merged = new Map<string, { quantity: number; unit: string }>();

  for (const recipe of allRecipes) {
    const ingredients = recipe.ingredients as {
      item: string;
      quantity: number;
      unit: string;
    }[];
    for (const ing of ingredients) {
      const key = `${normalizeItemName(ing.item)}|${normalizeUnit(ing.unit)}`;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        merged.set(key, {
          quantity: ing.quantity,
          unit: normalizeUnit(ing.unit),
        });
      }
    }
  }

  return merged;
}

export async function generateGroceryList(
  mealPlanId: string,
  weekOf: string,
  planRecipes: Recipe[]
) {
  const merged = mergeIngredients(planRecipes);

  // Categorize items
  const items: MergedItem[] = [];
  const uncategorized: string[] = [];
  const uncategorizedKeys: string[] = [];

  for (const [key, value] of merged) {
    const itemName = key.split("|")[0];
    const category = categorizeItem(itemName);

    if (category) {
      items.push({ item: itemName, category, ...value });
    } else {
      uncategorized.push(itemName);
      uncategorizedKeys.push(key);
    }
  }

  // Use LLM for uncategorized items
  if (uncategorized.length > 0) {
    try {
      const categories = await generateJSON<Record<string, string>>({
        system: SYSTEM_PROMPT,
        prompt: buildGroceryCategoryPrompt(uncategorized),
        timeoutMs: 30_000,
      });

      for (let i = 0; i < uncategorized.length; i++) {
        const itemName = uncategorized[i];
        const key = uncategorizedKeys[i];
        const value = merged.get(key)!;
        const category = categories[itemName] || "other";
        items.push({ item: itemName, category, ...value });
      }
    } catch {
      // Fallback: mark all uncategorized as "other"
      for (let i = 0; i < uncategorized.length; i++) {
        const key = uncategorizedKeys[i];
        const value = merged.get(key)!;
        items.push({
          item: uncategorized[i],
          category: "other",
          ...value,
        });
      }
    }
  }

  // Sort items by category for a nice shopping experience
  items.sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category as (typeof CATEGORY_ORDER)[number]) -
      CATEGORY_ORDER.indexOf(b.category as (typeof CATEGORY_ORDER)[number])
  );

  // Insert grocery list and items
  const [groceryList] = await db
    .insert(groceryLists)
    .values({ mealPlanId, weekOf })
    .returning({ id: groceryLists.id });

  if (items.length > 0) {
    await db.insert(groceryItems).values(
      items.map((item, index) => ({
        groceryListId: groceryList.id,
        item: item.item,
        quantity: item.quantity.toString(),
        unit: item.unit,
        category: item.category,
        sortOrder: index,
      }))
    );
  }

  return groceryList.id;
}
