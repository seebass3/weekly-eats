"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, RefreshCw, Loader2 } from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["", "MON", "TUE", "WED", "THU", "FRI"];

interface MealCardProps {
  id: string;
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

export function MealCard({
  id,
  name,
  cuisine,
  dayOfWeek,
  cookTimeMinutes,
  prepTimeMinutes,
  description,
}: MealCardProps) {
  const [isSwapping, setIsSwapping] = useState(false);
  const router = useRouter();
  const totalTime = cookTimeMinutes + (prepTimeMinutes ?? 0);

  async function handleSwap(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSwapping(true);

    try {
      const res = await fetch(`/api/recipes/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Swap failed");
      }

      router.refresh();
    } catch (error) {
      console.error("Swap failed:", error);
      alert(
        `Failed to swap: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <div className="group relative">
      <Link href={`/recipes/${id}`} className="block">
        <div className="flex gap-3 rounded-xl border bg-card p-3.5 transition-all hover:bg-accent/40 hover:shadow-sm active:scale-[0.98]">
          {dayOfWeek && (
            <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-2">
              <span className="text-[10px] font-bold tracking-wider text-primary">
                {DAY_SHORT[dayOfWeek]}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {dayOfWeek && (
                  <p className="text-xs text-muted-foreground">
                    {DAY_NAMES[dayOfWeek]}
                  </p>
                )}
                <h3 className="font-semibold leading-snug">{name}</h3>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </div>
            {description && (
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-1">
                {description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] font-normal">
                {cuisine}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {totalTime} min
              </span>
            </div>
          </div>
        </div>
      </Link>
      {/* Swap button */}
      <button
        onClick={handleSwap}
        disabled={isSwapping}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-background group-hover:opacity-100 disabled:opacity-100"
        aria-label="Swap this recipe"
        title="Swap recipe"
      >
        {isSwapping ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
