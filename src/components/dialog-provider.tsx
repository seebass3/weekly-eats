"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertOptions {
  title: string;
  description: string;
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}

interface DialogState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
  showCancel: boolean;
}

interface DialogContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "OK",
    destructive: false,
    showCancel: false,
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const alert = useCallback(({ title, description }: AlertOptions) => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setState({
        open: true,
        title,
        description,
        confirmLabel: "OK",
        destructive: false,
        showCancel: false,
      });
    });
  }, []);

  const confirm = useCallback(
    ({
      title,
      description,
      confirmLabel = "Continue",
      destructive = false,
    }: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({
          open: true,
          title,
          description,
          confirmLabel,
          destructive,
          showCancel: true,
        });
      });
    },
    []
  );

  function handleAction(result: boolean) {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      <AlertDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) handleAction(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {state.showCancel && (
              <AlertDialogCancel onClick={() => handleAction(false)}>
                Cancel
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => handleAction(true)}
              className={
                state.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {state.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
}
