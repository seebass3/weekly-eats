import { getMealPlanByWeek, getMostRecentMealPlan } from "@/lib/db/queries";
import { MealCard } from "@/components/meal-card";
import { WeekNav } from "@/components/week-nav";
import { GenerateButton } from "@/components/generate-button";
import { UtensilsCrossed } from "lucide-react";
import { getCurrentWeekMonday } from "@/lib/dates";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOf = week ?? getCurrentWeekMonday();

  let plan = await getMealPlanByWeek(weekOf);

  // If no plan for current week, show most recent
  if (!plan && !week) {
    plan = await getMostRecentMealPlan();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          This Week&apos;s Dinners
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          5 weeknight recipes, freshly generated
        </p>
      </div>

      <WeekNav weekOf={plan?.weekOf ?? weekOf} />

      {plan && plan.recipes.length > 0 ? (
        <>
          <div className="space-y-2.5">
            {plan.recipes.map((recipe) => (
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
              />
            ))}
          </div>
          <div className="px-4">
            <GenerateButton weekOf={weekOf} isRegenerate />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
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
      )}
    </div>
  );
}
