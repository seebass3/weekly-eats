type GroceryEvent = {
  type: "toggle";
  itemId: string;
  checked: boolean;
};

type Listener = (event: GroceryEvent) => void;

const listeners = new Set<Listener>();

export function subscribeToGroceryEvents(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitGroceryEvent(event: GroceryEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}
