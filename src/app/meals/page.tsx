import { getMealPlanByWeek, getMostRecentMealPlan } from "@/lib/db/queries";
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

      <MealList recipes={plan?.recipes ?? []} weekOf={weekOf} />
    </div>
  );
}
