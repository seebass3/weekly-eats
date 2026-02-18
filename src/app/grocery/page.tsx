import { getGroceryListForWeek } from "@/lib/db/queries";
import { GroceryListView } from "@/components/grocery-list-view";
import { ShoppingCart } from "lucide-react";

export default async function GroceryPage() {
  const groceryList = await getGroceryListForWeek();

  if (!groceryList) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grocery List</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Everything you need for the week
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No grocery list yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a meal plan and your list will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grocery List</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everything you need for the week
        </p>
      </div>
      <GroceryListView initialItems={groceryList.items} />
    </div>
  );
}
