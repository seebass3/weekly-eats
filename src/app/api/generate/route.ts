import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { generateWeeklyPlan } from "@/lib/ollama/generate-plan";
import { emitSyncEvent } from "@/lib/sync-events";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      weekOf?: string;
      force?: boolean;
      context?: string;
    };

    console.log(
      `Starting meal plan generation for week of: ${body.weekOf ?? "next Monday"}${body.force ? " (force regenerate)" : ""}`
    );

    const result = await generateWeeklyPlan({
      weekOf: body.weekOf,
      force: body.force,
      context: body.context,
    });

    if (result.alreadyExisted) {
      return NextResponse.json(
        { message: "Plan already exists for this week", ...result },
        { status: 200 }
      );
    }

    revalidateTag("meals", { expire: 0 });
    emitSyncEvent({ type: "meals:updated" });

    return NextResponse.json(
      { message: "Meal plan generated successfully", ...result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate meal plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate meal plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
