"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addGroceryItemsAction } from "@/lib/actions";

/**
 * Parses input like "2 lbs chicken breast" or "chicken breast" into
 * { quantity, unit, item }. Falls back to qty=1, unit="unit".
 */
function parseInput(raw: string): {
  item: string;
  quantity: number;
  unit: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { item: "", quantity: 1, unit: "unit" };

  // Try to match: [number] [unit] [item]
  const match = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(tbsp|tsp|cups?|oz|lbs?|g|ml|cloves?|cans?|bunch|head|stalks?|pieces?|slices?|whole|pinch|dash|handful)?\s+(.+)$/i
  );

  if (match) {
    return {
      quantity: parseFloat(match[1]),
      unit: match[2]?.toLowerCase() || "unit",
      item: match[3],
    };
  }

  // Try just a number prefix: "2 chicken breasts"
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (numMatch) {
    return {
      quantity: parseFloat(numMatch[1]),
      unit: "unit",
      item: numMatch[2],
    };
  }

  // No number — just an item name
  return { item: trimmed, quantity: 1, unit: "unit" };
}

export function AddGroceryItem() {
  const [input, setInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(async () => {
    const parsed = parseInput(input);
    if (!parsed.item) return;

    setIsAdding(true);

    const result = await addGroceryItemsAction([parsed]);

    if (!("error" in result)) {
      setInput("");
    }

    setIsAdding(false);
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isAdding) {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd, isAdding]
  );

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Add item, e.g. "2 lbs chicken"'
        className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        onClick={handleAdd}
        disabled={isAdding || !input.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        aria-label="Add item"
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
