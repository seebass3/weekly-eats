"use client";

import { useState, useEffect, useRef } from "react";

export interface AnimatedItem<T> {
  item: T;
  entering: boolean;
  exiting: boolean;
}

interface UseAnimatedListOptions<T> {
  items: T[];
  getKey: (item: T) => string;
  enterDuration?: number;
  exitDuration?: number;
}

export function useAnimatedList<T>({
  items,
  getKey,
  enterDuration = 300,
  exitDuration = 200,
}: UseAnimatedListOptions<T>): AnimatedItem<T>[] {
  const [animatedItems, setAnimatedItems] = useState<AnimatedItem<T>[]>(() =>
    items.map((item) => ({ item, entering: false, exiting: false }))
  );
  const prevKeysRef = useRef<Set<string>>(new Set(items.map(getKey)));
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const prevKeys = prevKeysRef.current;
    const currentKeys = new Set(items.map(getKey));

    const addedKeys = new Set<string>();
    const removedKeys = new Set<string>();

    for (const key of currentKeys) {
      if (!prevKeys.has(key)) addedKeys.add(key);
    }
    for (const key of prevKeys) {
      if (!currentKeys.has(key)) removedKeys.add(key);
    }

    prevKeysRef.current = currentKeys;

    if (addedKeys.size === 0 && removedKeys.size === 0) {
      setAnimatedItems((prev) => {
        const prevMap = new Map(prev.map((a) => [getKey(a.item), a]));
        return items.map((item) => {
          const existing = prevMap.get(getKey(item));
          if (existing?.exiting) return existing;
          return { item, entering: existing?.entering ?? false, exiting: false };
        });
      });
      return;
    }

    setAnimatedItems((prev) => {
      const result: AnimatedItem<T>[] = [];
      const currentMap = new Map(items.map((item) => [getKey(item), item]));

      // Add current items (with entering flag for new ones)
      for (const item of items) {
        const key = getKey(item);
        if (addedKeys.has(key)) {
          result.push({ item, entering: true, exiting: false });
        } else {
          const existing = prev.find((a) => getKey(a.item) === key);
          result.push({
            item,
            entering: existing?.entering ?? false,
            exiting: false,
          });
        }
      }

      // Keep removed items with exiting flag
      for (const animated of prev) {
        const key = getKey(animated.item);
        if (removedKeys.has(key) && !animated.exiting) {
          result.push({ item: animated.item, entering: false, exiting: true });
        }
      }

      return result;
    });

    // Clear entering flags after enterDuration
    for (const key of addedKeys) {
      const existing = timersRef.current.get(`enter-${key}`);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setAnimatedItems((prev) =>
          prev.map((a) =>
            getKey(a.item) === key ? { ...a, entering: false } : a
          )
        );
        timersRef.current.delete(`enter-${key}`);
      }, enterDuration);
      timersRef.current.set(`enter-${key}`, timer);
    }

    // Remove exiting items after exitDuration
    for (const key of removedKeys) {
      const existing = timersRef.current.get(`exit-${key}`);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setAnimatedItems((prev) =>
          prev.filter((a) => getKey(a.item) !== key || !a.exiting)
        );
        timersRef.current.delete(`exit-${key}`);
      }, exitDuration);
      timersRef.current.set(`exit-${key}`, timer);
    }
  }, [items, getKey, enterDuration, exitDuration]);

  return animatedItems;
}
