"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  recipeId: string;
  isFavorite: boolean;
}

export function FavoriteButton({ recipeId, isFavorite }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setFavorite(data.isFavorite);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all hover:bg-accent active:scale-90 disabled:opacity-50"
      aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          favorite
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-foreground"
        }`}
      />
    </button>
  );
}
