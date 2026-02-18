export interface GroceryItemPayload {
  id: string;
  item: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
  sortOrder: number;
}

export type SyncEvent =
  // Grocery: granular events for optimistic UI
  | { type: "grocery:toggle"; itemId: string; checked: boolean }
  | { type: "grocery:add"; items: GroceryItemPayload[] }
  | { type: "grocery:remove"; itemId: string }
  | { type: "grocery:clear" }
  // Coarse invalidation events
  | { type: "meals:updated" }
  | { type: "favorites:updated" }
  // Generation loading states (cross-tab skeletons)
  | { type: "generation:start"; weekOf: string }
  | { type: "generation:end" }
  | { type: "swap:start"; recipeId: string }
  | { type: "swap:end"; recipeId: string };

type Listener = (event: SyncEvent) => void;

// Use globalThis to persist listeners across module reloads in dev mode.
// Without this, Next.js dev mode creates separate module instances for
// route handlers vs server actions, breaking the in-memory pub/sub.
const globalForSync = globalThis as typeof globalThis & {
  __syncListeners?: Set<Listener>;
};
const listeners = (globalForSync.__syncListeners ??= new Set<Listener>());

export function subscribeToSyncEvents(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSyncEvent(event: SyncEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}
