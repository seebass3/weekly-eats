"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBasket, Trash2 } from "lucide-react";
import {
  toggleGroceryItemAction,
  removeGroceryItemAction,
  clearGroceryListAction,
} from "@/lib/actions";
import type { GroceryItemPayload } from "@/lib/grocery-events";

interface GroceryItem {
  id: string;
  item: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
  sortOrder: number;
}

interface GroceryListViewProps {
  initialItems: GroceryItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: "Produce",
  meat: "Meat & Protein",
  dairy: "Dairy & Eggs",
  bakery: "Bakery",
  frozen: "Frozen",
  pantry: "Pantry",
  spices: "Spices",
  other: "Other",
};

const CATEGORY_EMOJI: Record<string, string> = {
  produce: "\u{1F96C}",
  meat: "\u{1F969}",
  dairy: "\u{1F95A}",
  bakery: "\u{1F35E}",
  frozen: "\u{1F9CA}",
  pantry: "\u{1FAD9}",
  spices: "\u{1F9C2}",
  other: "\u{1F4E6}",
};

export function GroceryListView({ initialItems }: GroceryListViewProps) {
  const [items, setItems] = useState(initialItems);
  const removedItemRef = useRef<GroceryItem | null>(null);

  // Sync from server when cached data is revalidated
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // SSE subscription for real-time cross-tab updates
  useEffect(() => {
    const eventSource = new EventSource("/api/grocery/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as
        | { type: "toggle"; itemId: string; checked: boolean }
        | { type: "add"; items: GroceryItemPayload[] }
        | { type: "remove"; itemId: string }
        | { type: "clear" };

      if (data.type === "toggle") {
        setItems((prev) =>
          prev.map((item) =>
            item.id === data.itemId
              ? { ...item, checked: data.checked }
              : item
          )
        );
      } else if (data.type === "add") {
        setItems((prev) => [...prev, ...data.items]);
      } else if (data.type === "remove") {
        setItems((prev) => prev.filter((item) => item.id !== data.itemId));
      } else if (data.type === "clear") {
        setItems([]);
      }
    };

    return () => eventSource.close();
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );

    const result = await toggleGroceryItemAction(id);
    if ("error" in result) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    const itemToRemove = items.find((i) => i.id === id);
    if (!itemToRemove) return;

    removedItemRef.current = itemToRemove;
    setItems((prev) => prev.filter((item) => item.id !== id));

    const result = await removeGroceryItemAction(id);
    if ("error" in result) {
      if (removedItemRef.current) {
        setItems((prev) => [...prev, removedItemRef.current!].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleClear = useCallback(async () => {
    if (!window.confirm("Clear all items from the grocery list?")) return;

    const previousItems = items;
    setItems([]);

    const result = await clearGroceryListAction();
    if ("error" in result) {
      setItems(previousItems);
    }
  }, [items]);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const percentage =
    totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Group by category
  const grouped = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryOrder = [
    "produce",
    "meat",
    "dairy",
    "bakery",
    "frozen",
    "pantry",
    "spices",
    "other",
  ];

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Progress card */}
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {checkedCount} of {totalCount} items
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tabular-nums">
              {percentage}%
            </span>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Category groups */}
      {categoryOrder.map((category) => {
        const categoryItems = grouped[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        const allChecked = categoryItems.every((i) => i.checked);

        return (
          <div key={category}>
            <div className="mb-1.5 flex items-center gap-2 px-1">
              <span className="text-sm">{CATEGORY_EMOJI[category]}</span>
              <h3
                className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                  allChecked
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground"
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <span className="text-[11px] text-muted-foreground/60">
                {categoryItems.filter((i) => i.checked).length}/
                {categoryItems.length}
              </span>
            </div>
            <div className="space-y-0.5 rounded-lg border bg-card">
              {categoryItems.map((item, i) => (
                <div
                  key={item.id}
                  className={`group flex items-center ${
                    i !== categoryItems.length - 1 ? "border-b" : ""
                  } ${item.checked ? "bg-muted/30" : ""}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggle(item.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleToggle(item.id); } }}
                    className={`flex flex-1 cursor-pointer items-center gap-3 px-3 py-3 text-left transition-all active:bg-accent ${
                      item.checked ? "" : "hover:bg-accent/40"
                    }`}
                  >
                    <Checkbox
                      checked={item.checked}
                      tabIndex={-1}
                      className="transition-all"
                    />
                    <span
                      className={`flex-1 text-sm capitalize transition-all ${
                        item.checked
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.item}
                    </span>
                    <span
                      className={`shrink-0 text-xs tabular-nums transition-all ${
                        item.checked
                          ? "text-muted-foreground/40"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatQuantity(item.quantity)} {item.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-40 transition-all hover:bg-destructive/10 hover:opacity-100"
                    aria-label={`Remove ${item.item}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatQuantity(q: string): string {
  const num = parseFloat(q);
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(1);
}
