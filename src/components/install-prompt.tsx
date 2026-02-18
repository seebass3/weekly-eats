"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window)
    );
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches
    );
    setDismissed(!!localStorage.getItem("install-prompt-dismissed"));
  }, []);

  if (isStandalone || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", "true");
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">Install Weekly Eats</p>
          {isIOS ? (
            <p className="mt-1 text-muted-foreground">
              Tap the share button, then &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Add to your home screen for the best experience
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
