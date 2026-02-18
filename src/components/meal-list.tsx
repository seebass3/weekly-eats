"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { MealCardSkeleton } from "@/components/meal-card";
import {
  SortableMealCard,
  MealCardDragPreview,
} from "@/components/sortable-meal-card";
import { GenerateButton } from "@/components/generate-button";
import { useGeneration } from "@/components/generation-provider";
import { useDialog } from "@/components/dialog-provider";
import { swapRecipeDaysAction } from "@/lib/actions";
import { UtensilsCrossed } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface FavoriteRecipe {
  id: string;
  name: string;
  cuisine: string;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface MealListProps {
  recipes: Recipe[];
  weekOf: string;
  favorites?: FavoriteRecipe[];
}

export function MealList({ recipes, weekOf, favorites = [] }: MealListProps) {
  const { generatingWeekOf } = useGeneration();
  const isGenerating = generatingWeekOf === weekOf;
  const { alert } = useDialog();

  const [localRecipes, setLocalRecipes] = useState(recipes);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [justGenerated, setJustGenerated] = useState(false);
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    setLocalRecipes(recipes);
  }, [recipes]);

  // Track that generation started — stays true until stagger fires
  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    }
  }, [isGenerating]);

  // Trigger stagger when generation is done AND recipes have arrived
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && recipes.length > 0) {
      wasGeneratingRef.current = false;
      setJustGenerated(true);
      const timer = setTimeout(() => setJustGenerated(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, recipes.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeRecipe = localRecipes.find((r) => r.id === active.id);
      const overRecipe = localRecipes.find((r) => r.id === over.id);
      if (!activeRecipe || !overRecipe) return;

      // Optimistic update: swap dayOfWeek values locally
      const previousRecipes = localRecipes;
      setLocalRecipes((prev) =>
        prev
          .map((r) => {
            if (r.id === active.id)
              return { ...r, dayOfWeek: overRecipe.dayOfWeek };
            if (r.id === over.id)
              return { ...r, dayOfWeek: activeRecipe.dayOfWeek };
            return r;
          })
          .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))
      );

      const result = await swapRecipeDaysAction(
        active.id as string,
        over.id as string
      );

      if ("error" in result) {
        setLocalRecipes(previousRecipes);
        await alert({
          title: "Reorder failed",
          description: result.error as string,
        });
      }
    },
    [localRecipes, alert]
  );

  const activeRecipe = activeId
    ? localRecipes.find((r) => r.id === activeId)
    : null;

  const hasRecipes = localRecipes.length > 0;

  if (isGenerating) {
    return (
      <>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((day) => (
            <MealCardSkeleton key={day} dayOfWeek={day} />
          ))}
        </div>
        <div className="px-4">
          <GenerateButton weekOf={weekOf} isRegenerate={hasRecipes} />
        </div>
      </>
    );
  }

  if (localRecipes.length > 0) {
    return (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={localRecipes.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {localRecipes.map((recipe, index) => (
                <div
                  key={recipe.id}
                  className={
                    justGenerated
                      ? "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out fill-mode-backwards"
                      : ""
                  }
                  style={
                    justGenerated
                      ? { animationDelay: `${index * 75}ms` }
                      : undefined
                  }
                >
                  <SortableMealCard
                    id={recipe.id}
                    name={recipe.name}
                    cuisine={recipe.cuisine}
                    dayOfWeek={recipe.dayOfWeek}
                    cookTimeMinutes={recipe.cookTimeMinutes}
                    prepTimeMinutes={recipe.prepTimeMinutes}
                    description={recipe.description}
                    canSwap
                    favorites={favorites}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeRecipe ? (
              <MealCardDragPreview
                name={activeRecipe.name}
                cuisine={activeRecipe.cuisine}
                dayOfWeek={activeRecipe.dayOfWeek}
                cookTimeMinutes={activeRecipe.cookTimeMinutes}
                prepTimeMinutes={activeRecipe.prepTimeMinutes}
                description={activeRecipe.description}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="px-4">
          <GenerateButton weekOf={weekOf} isRegenerate />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <UtensilsCrossed className="h-6 w-6 text-primary/60" />
      </div>
      <div>
        <p className="font-medium">No meal plan yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate one and we&apos;ll plan your dinners for the week
        </p>
      </div>
      <div className="w-full max-w-xs px-4">
        <GenerateButton weekOf={weekOf} />
      </div>
    </div>
  );
}
