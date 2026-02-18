"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <Button
      variant={favorite ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart
        className={`mr-2 h-4 w-4 ${favorite ? "fill-current" : ""}`}
      />
      {favorite ? "Saved to Favorites" : "Save to Favorites"}
    </Button>
  );
}
