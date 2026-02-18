"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useDialog } from "@/components/dialog-provider";
import { useSwappingRecipes } from "@/components/sync-provider";
import { emitSwapStart, emitSwapEnd } from "@/lib/actions";
import { SwapDrawer } from "@/components/swap-drawer";
import { Clock, ChevronRight, RefreshCw } from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["", "MON", "TUE", "WED", "THU", "FRI"];

export function MealCardSkeleton({ dayOfWeek }: { dayOfWeek: number }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3.5">
      <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-2">
        <span className="text-[10px] font-bold tracking-wider text-primary">
          {DAY_SHORT[dayOfWeek]}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="space-y-1.5">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-14 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

interface FavoriteRecipe {
  id: string;
  name: string;
  cuisine: string;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface MealCardProps {
  id: string;
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
  canSwap?: boolean;
  favorites?: FavoriteRecipe[];
}

export function MealCard({
  id,
  name,
  cuisine,
  dayOfWeek,
  cookTimeMinutes,
  prepTimeMinutes,
  description,
  canSwap,
  favorites = [],
}: MealCardProps) {
  const [isSwapping, setIsSwapping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { alert } = useDialog();
  const swappingRecipeIds = useSwappingRecipes();
  const totalTime = cookTimeMinutes + (prepTimeMinutes ?? 0);

  const showSkeleton = isSwapping || swappingRecipeIds.has(id);

  function handleSwapTap(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDrawerOpen(true);
  }

  async function handleGenerateNew(context?: string) {
    setIsSwapping(true);
    emitSwapStart(id);

    try {
      const res = await fetch(`/api/recipes/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Swap failed");
      }

      router.refresh();
    } catch (error) {
      console.error("Swap failed:", error);
      await alert({
        title: "Swap failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSwapping(false);
      emitSwapEnd(id);
    }
  }

  if (showSkeleton && dayOfWeek) {
    return <MealCardSkeleton dayOfWeek={dayOfWeek} />;
  }

  return (
    <>
      <div className="group relative">
        <Link href={`/recipes/${id}`} className="block">
          <div className="flex gap-3 rounded-xl border bg-card p-3.5 shadow-sm shadow-black/[0.03] transition-all hover:bg-accent/40 hover:shadow-md hover:shadow-black/[0.06] active:scale-[0.98]">
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
                {canSwap ? (
                  <button
                    onClick={handleSwapTap}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground active:scale-90"
                    aria-label="Swap this recipe"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                )}
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
      </div>
      {canSwap && (
        <SwapDrawer
          recipeId={id}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          favorites={favorites.filter((f) => f.id !== id)}
          onGenerateNew={handleGenerateNew}
        />
      )}
    </>
  );
}
