"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function InstallSteps({ platform }: { platform: Platform }) {
  if (platform === "ios") {
    return (
      <ol className="mt-1.5 space-y-0.5 text-muted-foreground">
        <li>
          1. Open this page in <strong>Safari</strong> (required — other
          browsers don&apos;t support installing PWAs on iOS)
        </li>
        <li>
          2. Tap the <strong>Share</strong> button in the bottom toolbar (the
          square with an arrow pointing up)
        </li>
        <li>
          3. Scroll down the share sheet and tap{" "}
          <strong>Add to Home Screen</strong>
        </li>
        <li>
          4. Tap <strong>Add</strong> in the top-right corner to confirm
        </li>
      </ol>
    );
  }

  if (platform === "android") {
    return (
      <ol className="mt-1.5 space-y-0.5 text-muted-foreground">
        <li>
          1. Open this page in <strong>Chrome</strong>
        </li>
        <li>
          2. Tap the <strong>three-dot menu</strong> (⋮) in the top-right corner
        </li>
        <li>
          3. Tap <strong>Add to Home screen</strong> or{" "}
          <strong>Install app</strong>
        </li>
        <li>
          4. Tap <strong>Install</strong> to confirm — the app will appear on
          your home screen
        </li>
      </ol>
    );
  }

  return (
    <p className="mt-1 text-muted-foreground">
      Click the install icon in your browser&apos;s address bar to add this
      app to your desktop.
    </p>
  );
}

function dispatchVisibility(visible: boolean) {
  window.dispatchEvent(
    new CustomEvent("install-prompt-change", { detail: { visible } })
  );
}

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [visible, setVisible] = useState(false);

  // Dispatch visibility changes after render so we never setState in another
  // component mid-render (the InfoButton listens for this event).
  useEffect(() => {
    dispatchVisibility(visible);
  }, [visible]);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const wasDismissed = localStorage.getItem("install-prompt-dismissed");

    if (!isStandalone && !wasDismissed) {
      setPlatform(detectPlatform());
      setVisible(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      if (next) setPlatform(detectPlatform());
      return next;
    });
  }, []);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__toggleInstallPrompt =
      toggle;
    return () => {
      delete (window as unknown as Record<string, unknown>)
        .__toggleInstallPrompt;
    };
  }, [toggle]);

  if (!visible) return null;

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem("install-prompt-dismissed", "true");
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm">
          <p className="font-medium">Install Weekly Eats</p>
          <InstallSteps platform={platform} />
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
