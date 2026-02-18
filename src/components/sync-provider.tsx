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
      } else if (event.type === "generation:start") {
        startGeneration(event.weekOf);
      } else if (event.type === "generation:end") {
        endGeneration();
        router.refresh();
      } else if (event.type === "swap:start") {
        setSwappingRecipeIds((prev) => new Set(prev).add(event.recipeId));
      } else if (event.type === "swap:end") {
        setSwappingRecipeIds((prev) => {
          const next = new Set(prev);
          next.delete(event.recipeId);
          return next;
        });
        router.refresh();
      } else {
        // meals:updated, favorites:updated
        router.refresh();
      }
    };

    return () => eventSource.close();
  }, [router, startGeneration, endGeneration]);

  return (
    <SyncContext value={{ subscribeGrocery, swappingRecipeIds }}>
      {children}
    </SyncContext>
  );
}
