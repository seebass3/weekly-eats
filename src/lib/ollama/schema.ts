import { z } from "zod/v4";

export const RecipeSchema = z.object({
  name: z.string().min(1),
  cuisine: z.string().min(1),
  cook_time_minutes: z.number().int().positive(),
  prep_time_minutes: z.number().int().nonnegative().optional().default(0),
  servings: z.number().int().positive().default(4),
  description: z.string().optional().default(""),
  ingredients: z
    .array(
      z.object({
        item: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string(),
      })
    )
    .min(1),
  steps: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).optional().default([]),
});

export type GeneratedRecipe = z.infer<typeof RecipeSchema>;

export const WeekPlanSchema = z.object({
  recipes: z.array(RecipeSchema).length(5),
});

export type GeneratedWeekPlan = z.infer<typeof WeekPlanSchema>;
