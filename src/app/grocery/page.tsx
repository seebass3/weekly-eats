import { getGroceryListForWeek } from "@/lib/db/queries";
import { GroceryListView } from "@/components/grocery-list-view";

export default async function GroceryPage() {
  const groceryList = await getGroceryListForWeek();

  if (!groceryList) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grocery List</h1>
        <p className="mt-2 text-muted-foreground">
          Generate a meal plan to see your grocery list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Grocery List</h1>
      <GroceryListView initialItems={groceryList.items} />
    </div>
  );
}
