"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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
        // Revert on failure
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          )
        );
      }
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
    }
  }, []);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {checkedCount} of {totalCount} items
        </span>
        <span>{Math.round((checkedCount / totalCount) * 100)}% done</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(checkedCount / totalCount) * 100}%` }}
        />
      </div>

      {categoryOrder.map((category) => {
        const categoryItems = grouped[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50 active:bg-accent ${
                    item.checked ? "opacity-50" : ""
                  }`}
                >
                  <Checkbox checked={item.checked} tabIndex={-1} />
                  <span
                    className={`flex-1 text-sm ${
                      item.checked ? "line-through" : ""
                    }`}
                  >
                    {item.item}
                  </span>
                  <span className="text-xs text-muted-foreground">
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
