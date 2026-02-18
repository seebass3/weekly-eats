import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { BackButton } from "@/components/back-button";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) notFound();

  const totalTime = recipe.cookTimeMinutes + (recipe.prepTimeMinutes ?? 0);
  const ingredients = recipe.ingredients as {
    item: string;
    quantity: number;
    unit: string;
  }[];
  const steps = recipe.steps as string[];

  return (
    <div className="space-y-6">
      <BackButton />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{recipe.name}</h1>
        {recipe.description && (
          <p className="mt-1 text-muted-foreground">{recipe.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{recipe.cuisine}</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings} servings
          </span>
        </div>
        <div className="mt-3">
          <FavoriteButton recipeId={recipe.id} isFavorite={recipe.isFavorite} />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="font-medium text-foreground">
                {ing.quantity} {ing.unit}
              </span>
              <span className="text-muted-foreground">{ing.item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Steps</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
