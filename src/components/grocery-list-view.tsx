"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBasket } from "lucide-react";

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
  produce: "🥬",
  meat: "🥩",
  dairy: "🥚",
  bakery: "🍞",
  frozen: "🧊",
  pantry: "🫙",
  spices: "🧂",
  other: "📦",
};

export function GroceryListView({ initialItems }: GroceryListViewProps) {
  const [items, setItems] = useState(initialItems);

  // SSE subscription for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/grocery/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        type: string;
        itemId: string;
        checked: boolean;
      };

      if (data.type === "toggle") {
        setItems((prev) =>
          prev.map((item) =>
            item.id === data.itemId ? { ...item, checked: data.checked } : item
          )
        );
      }
    };

    return () => eventSource.close();
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );

    try {
      const res = await fetch(`/api/grocery/${id}`, { method: "PATCH" });
      if (!res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }, []);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

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
          <span className="text-sm font-semibold tabular-nums">
            {percentage}%
          </span>
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
                  allChecked ? "text-muted-foreground/50" : "text-muted-foreground"
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <span className="text-[11px] text-muted-foreground/60">
                {categoryItems.filter((i) => i.checked).length}/{categoryItems.length}
              </span>
            </div>
            <div className="space-y-0.5 rounded-lg border bg-card">
              {categoryItems.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-all active:bg-accent ${
                    i !== categoryItems.length - 1 ? "border-b" : ""
                  } ${item.checked ? "bg-muted/30" : "hover:bg-accent/40"}`}
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
                </button>
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
