"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface GenerationState {
  generatingWeekOf: string | null;
  startGeneration: (weekOf: string) => void;
  endGeneration: () => void;
}

const GenerationContext = createContext<GenerationState>({
  generatingWeekOf: null,
  startGeneration: () => {},
  endGeneration: () => {},
});

export function GenerationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [generatingWeekOf, setGeneratingWeekOf] = useState<string | null>(null);

  const startGeneration = useCallback((weekOf: string) => {
    setGeneratingWeekOf(weekOf);
  }, []);

  const endGeneration = useCallback(() => {
    setGeneratingWeekOf(null);
  }, []);

  return (
    <GenerationContext value={{ generatingWeekOf, startGeneration, endGeneration }}>
      {children}
    </GenerationContext>
  );
}

export function useGeneration() {
  return useContext(GenerationContext);
}
