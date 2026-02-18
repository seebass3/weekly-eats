"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions";

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
}

export function FavoriteButton({ recipeId, isFavorite }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  // Sync from server when RSC re-renders with updated prop (e.g. via router.refresh)
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  async function handleToggle() {
    setIsLoading(true);
    try {
      const result = await toggleFavoriteAction(recipeId);
      setFavorite(result.isFavorite);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-50"
      aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
    >
      <Heart
        key={String(favorite)}
        className={`h-5 w-5 transition-colors ${
          favorite
            ? "animate-[heart-bounce_0.35s_ease-out] fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-foreground"
        }`}
      />
    </button>
  );
}
