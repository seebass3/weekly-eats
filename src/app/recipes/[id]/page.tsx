import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/db/queries";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Flame } from "lucide-react";
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
    <div className="space-y-6 pb-4">
      <BackButton />

      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            {recipe.name}
          </h1>
          <FavoriteButton recipeId={recipe.id} isFavorite={recipe.isFavorite} />
        </div>
        {recipe.description && (
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="secondary">{recipe.cuisine}</Badge>
          {recipe.tags &&
            (recipe.tags as string[]).slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-lg bg-muted/60 px-3 py-2.5">
            <Clock className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{totalTime}m</span>
            <span className="text-[11px] text-muted-foreground">total</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted/60 px-3 py-2.5">
            <Flame className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {recipe.cookTimeMinutes}m
            </span>
            <span className="text-[11px] text-muted-foreground">cook</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted/60 px-3 py-2.5">
            <Users className="mb-1 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{recipe.servings}</span>
            <span className="text-[11px] text-muted-foreground">servings</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ingredients
        </h2>
        <ul className="space-y-2.5">
          {ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <span className="capitalize">{ing.item}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {ing.quantity} {ing.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Instructions
        </h2>
        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
