import { db } from "@/lib/db";
import {
  groceryLists,
  groceryItems,
  type recipes as recipesTable,
} from "@/lib/db/schema";
import { generateJSON } from "./client";
import { SYSTEM_PROMPT, buildGroceryCategoryPrompt } from "./prompts";

type Recipe = typeof recipesTable.$inferSelect;

interface MergedItem {
  item: string;
  quantity: number;
  unit: string;
  category: string;
}

// Static category map for common ingredients
const CATEGORY_MAP: Record<string, string> = {
  // Produce
  onion: "produce",
  garlic: "produce",
  tomato: "produce",
  potato: "produce",
  carrot: "produce",
  celery: "produce",
  "sweet pepper": "produce",
  broccoli: "produce",
  spinach: "produce",
  lettuce: "produce",
  cucumber: "produce",
  zucchini: "produce",
  mushroom: "produce",
  avocado: "produce",
  lemon: "produce",
  lime: "produce",
  ginger: "produce",
  cilantro: "produce",
  parsley: "produce",
  basil: "produce",
  scallion: "produce",
  "green onion": "produce",
  "bell pepper": "produce",
  jalapeño: "produce",
  corn: "produce",
  "sweet potato": "produce",
  cabbage: "produce",
  kale: "produce",
  asparagus: "produce",
  "green bean": "produce",
  pea: "produce",
  "bean sprout": "produce",
  eggplant: "produce",
  squash: "produce",

  // Meat & protein
  chicken: "meat",
  beef: "meat",
  pork: "meat",
  salmon: "meat",
  shrimp: "meat",
  fish: "meat",
  turkey: "meat",
  lamb: "meat",
  "ground beef": "meat",
  "ground turkey": "meat",
  "ground pork": "meat",
  bacon: "meat",
  sausage: "meat",
  tofu: "meat",
  steak: "meat",
  "chicken breast": "meat",
  "chicken thigh": "meat",
  tuna: "meat",
  cod: "meat",
  tilapia: "meat",

  // Dairy
  butter: "dairy",
  cheese: "dairy",
  milk: "dairy",
  cream: "dairy",
  "sour cream": "dairy",
  yogurt: "dairy",
  "heavy cream": "dairy",
  parmesan: "dairy",
  mozzarella: "dairy",
  cheddar: "dairy",
  "cream cheese": "dairy",
  egg: "dairy",
  eggs: "dairy",
  "feta cheese": "dairy",

  // Pantry
  "olive oil": "pantry",
  "vegetable oil": "pantry",
  "soy sauce": "pantry",
  "fish sauce": "pantry",
  vinegar: "pantry",
  sugar: "pantry",
  flour: "pantry",
  rice: "pantry",
  pasta: "pantry",
  noodle: "pantry",
  "chicken broth": "pantry",
  "beef broth": "pantry",
  broth: "pantry",
  stock: "pantry",
  "coconut milk": "pantry",
  "tomato sauce": "pantry",
  "tomato paste": "pantry",
  "canned tomato": "pantry",
  beans: "pantry",
  lentil: "pantry",
  "sesame oil": "pantry",
  honey: "pantry",
  "maple syrup": "pantry",
  "hot sauce": "pantry",
  "worcestershire sauce": "pantry",
  mustard: "pantry",
  ketchup: "pantry",
  mayo: "pantry",
  mayonnaise: "pantry",
  "peanut butter": "pantry",
  "bread crumbs": "pantry",
  "panko": "pantry",
  cornstarch: "pantry",
  "baking powder": "pantry",
  "tortilla": "pantry",
  bread: "pantry",

  // Spices
  salt: "spices",
  pepper: "spices",
  "black pepper": "spices",
  cumin: "spices",
  paprika: "spices",
  "chili powder": "spices",
  oregano: "spices",
  thyme: "spices",
  rosemary: "spices",
  "bay leaf": "spices",
  cinnamon: "spices",
  nutmeg: "spices",
  "garlic powder": "spices",
  "onion powder": "spices",
  "red pepper flakes": "spices",
  turmeric: "spices",
  coriander: "spices",
  "curry powder": "spices",
  "garam masala": "spices",
  "italian seasoning": "spices",
  "smoked paprika": "spices",
  "cayenne pepper": "spices",
  "chili flakes": "spices",
};

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/s$/, ""); // basic depluralize
}

function categorizeItem(itemName: string): string | null {
  const normalized = normalizeItemName(itemName);

  // Direct match
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];

  // Partial match — check if the item contains a known key
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  return null;
}

function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    cup: "cup",
    cups: "cup",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    g: "g",
    gram: "g",
    grams: "g",
    ml: "ml",
    clove: "clove",
    cloves: "clove",
    piece: "piece",
    pieces: "piece",
    slice: "slice",
    slices: "slice",
    can: "can",
    cans: "can",
    bunch: "bunch",
    head: "head",
    stalk: "stalk",
    stalks: "stalk",
    whole: "whole",
    "": "unit",
    unit: "unit",
    pinch: "pinch",
    dash: "dash",
    handful: "handful",
  };

  return unitMap[unit.toLowerCase().trim()] || unit.toLowerCase().trim();
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
  const categoryOrder = [
    "produce",
    "meat",
    "dairy",
    "bakery",
    "frozen",
    "pantry",
    "spices",
    "other",
  ];
  items.sort(
    (a, b) =>
      categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  );

  // Insert grocery list and items
  const [groceryList] = await db
    .insert(groceryLists)
    .values({ mealPlanId })
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
