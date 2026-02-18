import {
  getMealPlanByWeek,
  getMostRecentMealPlan,
  getFavorites,
} from "@/lib/db/queries";
import { WeekNav } from "@/components/week-nav";
import { MealList } from "@/components/meal-list";
import { getCurrentWeekMonday } from "@/lib/dates";

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOf = week ?? getCurrentWeekMonday();

  const [plan, favorites] = await Promise.all([
    getMealPlanByWeek(weekOf),
    getFavorites(),
  ]);

  let activePlan = plan;

  // If no plan for current week, show most recent
  if (!activePlan && !week) {
    activePlan = await getMostRecentMealPlan();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          This Week&apos;s Dinners
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          5 weeknight recipes, freshly generated
        </p>
      </div>

      <WeekNav weekOf={weekOf} />

      <MealList
        recipes={activePlan?.recipes ?? []}
        weekOf={weekOf}
        favorites={favorites}
      />
    </div>
  );
}
