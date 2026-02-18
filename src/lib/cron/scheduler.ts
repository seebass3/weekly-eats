import cron from "node-cron";
import { generateWeeklyPlan } from "@/lib/ollama/generate-plan";

let scheduled = false;

export function startScheduler() {
  if (scheduled) return;
  scheduled = true;

  // Sunday at 8:00 AM
  cron.schedule("0 8 * * 0", async () => {
    console.log("[cron] Sunday meal plan generation triggered");
    try {
      const result = await generateWeeklyPlan();
      if (result.alreadyExisted) {
        console.log("[cron] Plan already exists for this week, skipping");
      } else {
        console.log(
          `[cron] Generated meal plan: ${result.mealPlanId}`
        );
      }
    } catch (error) {
      console.error("[cron] Failed to generate meal plan:", error);
    }
  });

  console.log("[cron] Scheduler started — meal plans generate Sundays at 8 AM");
}
