"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

export function InfoButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onChange(e: Event) {
      const { visible } = (e as CustomEvent<{ visible: boolean }>).detail;
      setOpen(visible);
    }
    window.addEventListener("install-prompt-change", onChange);
    return () => window.removeEventListener("install-prompt-change", onChange);
  }, []);

  function handleClick() {
    const toggler = (window as unknown as Record<string, unknown>)
      .__toggleInstallPrompt;
    if (typeof toggler === "function") {
      (toggler as () => void)();
    }
  }

  const Icon = open ? X : Info;

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-[4.75rem] right-4 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-primary/10 hover:text-foreground ${
        open ? "text-foreground" : "text-muted-foreground"
      }`}
      aria-label={open ? "Close install info" : "Install app info"}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
