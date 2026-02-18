import { getGroceryListForWeek } from "@/lib/db/queries";
import { GroceryListView } from "@/components/grocery-list-view";
import { AddGroceryItem } from "@/components/add-grocery-item";
import { ShoppingCart } from "lucide-react";

export default async function GroceryPage() {
  const groceryList = await getGroceryListForWeek();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Grocery List</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everything you need for the week
        </p>
      </div>

      <AddGroceryItem />

      {groceryList && groceryList.items.length > 0 ? (
        <GroceryListView initialItems={groceryList.items} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary/60" />
          </div>
          <div>
            <p className="font-medium">No items yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add items above or from a recipe page
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
