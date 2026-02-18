"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useGeneration } from "@/components/generation-provider";
import type { SyncEvent } from "@/lib/sync-events";

type SyncEventHandler = (event: SyncEvent) => void;

interface SyncContextValue {
  subscribeGrocery: (handler: SyncEventHandler) => () => void;
  swappingRecipeIds: Set<string>;
}

const SyncContext = createContext<SyncContextValue>({
  subscribeGrocery: () => () => {},
  swappingRecipeIds: new Set(),
});

export function useSyncGrocery(handler: SyncEventHandler) {
  const { subscribeGrocery } = useContext(SyncContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return subscribeGrocery((event) => handlerRef.current(event));
  }, [subscribeGrocery]);
}

export function useSwappingRecipes() {
  return useContext(SyncContext).swappingRecipeIds;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { startGeneration, endGeneration } = useGeneration();
  const [swappingRecipeIds, setSwappingRecipeIds] = useState<Set<string>>(
    new Set()
  );
  const groceryListenersRef = useRef(new Set<SyncEventHandler>());

  // Use refs for all callbacks to keep the EventSource effect stable.
  // Without refs, router/startGeneration/endGeneration in the dependency
  // array cause the EventSource to tear down and reconnect on every
  // navigation (especially with cacheComponents), losing events.
  const routerRef = useRef(router);
  routerRef.current = router;
  const startGenerationRef = useRef(startGeneration);
  startGenerationRef.current = startGeneration;
  const endGenerationRef = useRef(endGeneration);
  endGenerationRef.current = endGeneration;

  const subscribeGrocery = useCallback((handler: SyncEventHandler) => {
    groceryListenersRef.current.add(handler);
    return () => {
      groceryListenersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/sync/events");

    eventSource.onmessage = (msg) => {
      const event: SyncEvent = JSON.parse(msg.data);

      if (event.type.startsWith("grocery:")) {
        for (const listener of groceryListenersRef.current) {
          listener(event);
        }
        // Also refresh the server component so the page can switch
        // between the empty state and the list view when items are
        // added to an empty list or the list is cleared.
        routerRef.current.refresh();
      } else if (event.type === "generation:start") {
        startGenerationRef.current(event.weekOf);
      } else if (event.type === "generation:end") {
        endGenerationRef.current();
        routerRef.current.refresh();
      } else if (event.type === "swap:start") {
        setSwappingRecipeIds((prev) => new Set(prev).add(event.recipeId));
      } else if (event.type === "swap:end") {
        setSwappingRecipeIds((prev) => {
          const next = new Set(prev);
          next.delete(event.recipeId);
          return next;
        });
        routerRef.current.refresh();
      } else {
        // meals:updated, favorites:updated
        routerRef.current.refresh();
      }
    };

    return () => eventSource.close();
    // Empty deps — refs keep callbacks current without reconnecting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SyncContext value={{ subscribeGrocery, swappingRecipeIds }}>
      {children}
    </SyncContext>
  );
}
