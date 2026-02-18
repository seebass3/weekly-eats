"use client";

import { MealCard, MealCardSkeleton } from "@/components/meal-card";
import { GenerateButton } from "@/components/generate-button";
import { useGeneration } from "@/components/generation-provider";
import { UtensilsCrossed } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface FavoriteRecipe {
  id: string;
  name: string;
  cuisine: string;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface MealListProps {
  recipes: Recipe[];
  weekOf: string;
  favorites?: FavoriteRecipe[];
}

export function MealList({ recipes, weekOf, favorites = [] }: MealListProps) {
  const { generatingWeekOf } = useGeneration();
  const isGenerating = generatingWeekOf === weekOf;

  const hasRecipes = recipes.length > 0;

  if (isGenerating) {
    return (
      <>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((day) => (
            <MealCardSkeleton key={day} dayOfWeek={day} />
          ))}
        </div>
        <div className="px-4">
          <GenerateButton weekOf={weekOf} isRegenerate={hasRecipes} />
        </div>
      </>
    );
  }

  if (recipes.length > 0) {
    return (
      <>
        <div className="space-y-2.5">
          {recipes.map((recipe) => (
            <MealCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              cuisine={recipe.cuisine}
              dayOfWeek={recipe.dayOfWeek}
              cookTimeMinutes={recipe.cookTimeMinutes}
              prepTimeMinutes={recipe.prepTimeMinutes}
              description={recipe.description}
              canSwap
              favorites={favorites}
            />
          ))}
        </div>
        <div className="px-4">
          <GenerateButton weekOf={weekOf} isRegenerate />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <UtensilsCrossed className="h-6 w-6 text-primary/60" />
      </div>
      <div>
        <p className="font-medium">No meal plan yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate one and we&apos;ll plan your dinners for the week
        </p>
      </div>
      <div className="w-full max-w-xs px-4">
        <GenerateButton weekOf={weekOf} />
      </div>
    </div>
  );
}
