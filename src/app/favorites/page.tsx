import { getFavorites } from "@/lib/db/queries";
import { MealCard } from "@/components/meal-card";

export default async function FavoritesPage() {
  const favorites = await getFavorites();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>

      {favorites.length > 0 ? (
        <div className="space-y-3">
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
        <p className="py-12 text-center text-muted-foreground">
          Save recipes you love and they&apos;ll show up here.
        </p>
      )}
    </div>
  );
}
