import { getMealPlanByWeek, getMostRecentMealPlan } from "@/lib/db/queries";
import { MealCard } from "@/components/meal-card";
import { WeekNav } from "@/components/week-nav";
import { GenerateButton } from "@/components/generate-button";

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        This Week&apos;s Dinners
      </h1>
      <WeekNav weekOf={plan?.weekOf ?? weekOf} />

      {plan && plan.recipes.length > 0 ? (
        <div className="space-y-3">
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
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            No meal plan for this week yet.
          </p>
          <GenerateButton weekOf={weekOf} />
        </div>
      )}
    </div>
  );
}
