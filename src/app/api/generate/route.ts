import { NextResponse } from "next/server";
import { generateWeeklyPlan } from "@/lib/ollama/generate-plan";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      weekOf?: string;
    };

    console.log(
      `Starting meal plan generation for week of: ${body.weekOf ?? "next Monday"}`
    );

    const result = await generateWeeklyPlan(body.weekOf);

    if (result.alreadyExisted) {
      return NextResponse.json(
        { message: "Plan already exists for this week", ...result },
        { status: 200 }
      );
    }

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
