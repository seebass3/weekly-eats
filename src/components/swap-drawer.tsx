"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDialog } from "@/components/dialog-provider";
import { replaceWithFavoriteAction, emitSwapStart, emitSwapEnd } from "@/lib/actions";
import { Clock, Heart, Sparkles, Loader2 } from "lucide-react";

interface FavoriteRecipe {
  id: string;
  name: string;
  cuisine: string;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface SwapDrawerProps {
  recipeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  favorites: FavoriteRecipe[];
  onGenerateNew: () => void;
}

export function SwapDrawer({
  recipeId,
  open,
  onOpenChange,
  favorites,
  onGenerateNew,
}: SwapDrawerProps) {
  const [isReplacing, setIsReplacing] = useState<string | null>(null);
  const router = useRouter();
  const { alert } = useDialog();

  async function handlePickFavorite(favoriteRecipeId: string) {
    setIsReplacing(favoriteRecipeId);
    emitSwapStart(recipeId);

    try {
      const result = await replaceWithFavoriteAction(recipeId, favoriteRecipeId);

      if ("error" in result) {
        throw new Error(result.error);
      }

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Replace failed:", error);
      await alert({
        title: "Replace failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsReplacing(null);
      emitSwapEnd(recipeId);
    }
  }

  function handleGenerateNew() {
    onOpenChange(false);
    onGenerateNew();
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Swap Recipe</DrawerTitle>
          </DrawerHeader>

          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
            {favorites.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Heart className="h-3 w-3 text-primary/60" />
                  From favorites
                </p>
                {favorites.map((fav) => {
                  const totalTime =
                    fav.cookTimeMinutes + (fav.prepTimeMinutes ?? 0);
                  const isLoading = isReplacing === fav.id;

                  return (
                    <button
                      key={fav.id}
                      onClick={() => handlePickFavorite(fav.id)}
                      disabled={isReplacing !== null}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:bg-primary/5 active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{fav.name}</p>
                        {fav.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                            {fav.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-normal"
                          >
                            {fav.cuisine}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {totalTime} min
                          </span>
                        </div>
                      </div>
                      {isLoading && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className={favorites.length > 0 ? "mt-4" : ""}>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerateNew}
                disabled={isReplacing !== null}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate a new recipe
              </Button>
            </div>

            {favorites.length === 0 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                No favorites yet — save recipes from the recipe page
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
