"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { addGroceryItemsAction } from "@/lib/actions";

interface Ingredient {
  item: string;
  quantity: number;
  unit: string;
}

interface AddIngredientsToListProps {
  ingredients: Ingredient[];
}

export function AddIngredientsToList({
  ingredients,
}: AddIngredientsToListProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allSelected = selected.size === ingredients.length;

  const toggleItem = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setFeedback(null);
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ingredients.map((_, i) => i)));
    }
    setFeedback(null);
  }, [allSelected, ingredients]);

  const handleAdd = useCallback(async () => {
    if (selected.size === 0) return;

    setIsAdding(true);
    setFeedback(null);

    const items = Array.from(selected).map((i) => ingredients[i]);

    const result = await addGroceryItemsAction(items);

    if ("error" in result) {
      setFeedback("Failed to add items");
    } else {
      const parts: string[] = [];
      if (result.added > 0) parts.push(`${result.added} added`);
      if (result.merged > 0) parts.push(`${result.merged} merged`);
      setFeedback(parts.join(", "));
      setSelected(new Set());
    }

    setIsAdding(false);
  }, [selected, ingredients]);

  return (
    <div className="rounded-xl bg-primary/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ingredients
        </h2>
        <button
          onClick={toggleAll}
          className="text-xs font-medium text-primary hover:underline"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      <ul className="space-y-1">
        {ingredients.map((ing, i) => (
          <li key={i}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleItem(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleItem(i); } }}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                selected.has(i) ? "bg-primary/[0.08]" : "hover:bg-accent/40"
              }`}
            >
              <Checkbox
                checked={selected.has(i)}
                tabIndex={-1}
                className="shrink-0"
              />
              <span className="flex-1 text-sm capitalize">{ing.item}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {ing.quantity} {ing.unit}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {(selected.size > 0 || feedback) && (
        <div className="mt-3 flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              onClick={handleAdd}
              disabled={isAdding}
              size="sm"
              className="flex-1"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Add {selected.size} to grocery list
                </>
              )}
            </Button>
          )}
          {feedback && (
            <span className="animate-in fade-in slide-in-from-bottom-1 duration-300 flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-green-500" />
              {feedback}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
