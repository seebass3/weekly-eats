import { connection } from "next/server";
import { getGroceryListForWeek } from "@/lib/db/queries";
import { GroceryListView } from "@/components/grocery-list-view";
import { AddGroceryItem } from "@/components/add-grocery-item";

export default async function GroceryPage() {
  await connection();
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

      <GroceryListView initialItems={groceryList?.items ?? []} />
    </div>
  );
}
