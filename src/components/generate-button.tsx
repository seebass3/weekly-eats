"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useGeneration } from "@/components/generation-provider";

interface GenerateButtonProps {
  weekOf?: string;
  isRegenerate?: boolean;
}

export function GenerateButton({ weekOf, isRegenerate }: GenerateButtonProps) {
  const { generatingWeekOf, startGeneration, endGeneration } = useGeneration();
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState("");
  const router = useRouter();

  const isGenerating = generatingWeekOf === weekOf;

  async function handleGenerate() {
    if (!weekOf) return;
    startGeneration(weekOf);

    try {
      const body: Record<string, unknown> = { weekOf };
      if (isRegenerate) body.force = true;
      if (context.trim()) body.context = context.trim();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      setContext("");
      setShowContext(false);
      router.push(`/meals?week=${weekOf}`);
      router.refresh();
    } catch (error) {
      console.error("Generation failed:", error);
      alert(
        `Failed to generate: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      endGeneration();
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || generatingWeekOf !== null}
        variant={isRegenerate ? "outline" : "default"}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isRegenerate ? "Regenerating..." : "Generating recipes..."}
          </>
        ) : generatingWeekOf !== null ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating another week...
          </>
        ) : (
          <>
            {isRegenerate ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isRegenerate ? "Regenerate Week" : "Generate Meal Plan"}
          </>
        )}
      </Button>
      {!generatingWeekOf && (
        <>
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Add context
            {showContext ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showContext && (
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder='e.g. "We have chicken and broccoli to use up"'
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={2}
            />
          )}
        </>
      )}
    </div>
  );
}
