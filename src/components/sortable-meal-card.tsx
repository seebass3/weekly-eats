"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock } from "lucide-react";
import { MealCard } from "@/components/meal-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FavoriteRecipe {
  id: string;
  name: string;
  cuisine: string;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

interface SortableMealCardProps {
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

export function SortableMealCard(props: SortableMealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-0 rounded-xl",
        isDragging && "opacity-50",
        isOver && !isDragging && "ring-2 ring-primary/30"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 active:cursor-grabbing"
        aria-label={`Reorder ${props.name}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <MealCard
          id={props.id}
          name={props.name}
          cuisine={props.cuisine}
          dayOfWeek={props.dayOfWeek}
          cookTimeMinutes={props.cookTimeMinutes}
          prepTimeMinutes={props.prepTimeMinutes}
          description={props.description}
          canSwap={props.canSwap}
          favorites={props.favorites}
        />
      </div>
    </div>
  );
}

const DAY_SHORT = ["", "MON", "TUE", "WED", "THU", "FRI"];
const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function MealCardDragPreview({
  name,
  cuisine,
  dayOfWeek,
  cookTimeMinutes,
  prepTimeMinutes,
  description,
}: {
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}) {
  const totalTime = cookTimeMinutes + (prepTimeMinutes ?? 0);

  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3.5 shadow-xl rotate-1 scale-105">
      {dayOfWeek && (
        <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-2">
          <span className="text-[10px] font-bold tracking-wider text-primary">
            {DAY_SHORT[dayOfWeek]}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="min-w-0">
          {dayOfWeek && (
            <p className="text-xs text-muted-foreground">
              {DAY_NAMES[dayOfWeek]}
            </p>
          )}
          <h3 className="font-semibold leading-snug">{name}</h3>
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
  );
}
