import { NextResponse } from "next/server";
import { generateWeeklyPlan } from "@/lib/ollama/generate-plan";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateWeeklyPlan();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron generation failed:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
