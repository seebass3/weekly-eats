import { NextResponse } from "next/server";
import { regenerateSingleRecipe } from "@/lib/ollama/generate-plan";

export const maxDuration = 120;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      context?: string;
    };

    console.log(`Regenerating recipe ${id}${body.context ? ` with context: ${body.context}` : ""}`);

    const updated = await regenerateSingleRecipe(id, body.context);

    return NextResponse.json({
      message: "Recipe regenerated successfully",
      recipe: updated,
    });
  } catch (error) {
    console.error("Failed to regenerate recipe:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate recipe",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
