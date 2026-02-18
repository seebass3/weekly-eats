import { getFavorites } from "@/lib/db/queries";
import { MealCard } from "@/components/meal-card";
import { Heart } from "lucide-react";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {favorites.length > 0
            ? `${favorites.length} saved recipe${favorites.length === 1 ? "" : "s"}`
            : "Your saved recipes will appear here"}
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="space-y-2.5">
          {favorites.map((recipe) => (
            <MealCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              cuisine={recipe.cuisine}
              dayOfWeek={null}
              cookTimeMinutes={recipe.cookTimeMinutes}
              prepTimeMinutes={recipe.prepTimeMinutes}
              description={recipe.description}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary/60" />
          </div>
          <div>
            <p className="font-medium">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any recipe to save it here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
