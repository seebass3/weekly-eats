import {
  pgTable,
  uuid,
  date,
  timestamp,
  text,
  smallint,
  integer,
  jsonb,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

export const mealPlans = pgTable("meal_plans", {
  id: uuid().primaryKey().defaultRandom(),
  weekOf: date("week_of").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  generatedBy: text("generated_by").notNull().default("auto"),
});

export const recipes = pgTable("recipes", {
  id: uuid().primaryKey().defaultRandom(),
  mealPlanId: uuid("meal_plan_id").references(() => mealPlans.id),
  name: text().notNull(),
  cuisine: text().notNull(),
  dayOfWeek: smallint("day_of_week"),
  cookTimeMinutes: integer("cook_time_minutes").notNull(),
  prepTimeMinutes: integer("prep_time_minutes"),
  servings: integer().notNull().default(2),
  description: text(),
  ingredients: jsonb()
    .notNull()
    .$type<{ item: string; quantity: number; unit: string }[]>(),
  steps: jsonb().notNull().$type<string[]>(),
  tags: text().array(),
  source: text().notNull().default("generated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedRecipes = pgTable("saved_recipes", {
  id: uuid().primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .unique()
    .references(() => recipes.id),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
  notes: text(),
  timesUsed: integer("times_used").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
});

export const groceryLists = pgTable("grocery_lists", {
  id: uuid().primaryKey().defaultRandom(),
  mealPlanId: uuid("meal_plan_id")
    .notNull()
    .unique()
    .references(() => mealPlans.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groceryItems = pgTable("grocery_items", {
  id: uuid().primaryKey().defaultRandom(),
  groceryListId: uuid("grocery_list_id")
    .notNull()
    .references(() => groceryLists.id),
  item: text().notNull(),
  quantity: numeric().notNull(),
  unit: text().notNull(),
  category: text().notNull(),
  checked: boolean().notNull().default(false),
  checkedAt: timestamp("checked_at"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
