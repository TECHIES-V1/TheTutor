"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`${componentName} must be used within Dialog`);
  }
  return context;
}

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Dialog({ children, open, defaultOpen = false, onOpenChange }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const value = useMemo<DialogContextValue>(
    () => ({ open: isOpen, setOpen }),
    [isOpen, setOpen],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

type DialogTriggerProps = {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
};

export function DialogTrigger({ children, asChild = false, className }: DialogTriggerProps) {
  const { setOpen } = useDialogContext("DialogTrigger");

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: () => void }>;
    const existingClick = child.props.onClick;

    return cloneElement(child, {
      onClick: () => {
        existingClick?.();
        setOpen(true);
      },
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setOpen(true);
      }}
    >
      {children}
    </button>
  );
}

type DialogContentProps = {
  children: ReactNode;
  className?: string;
};

export function DialogContent({ children, className }: DialogContentProps) {
  const { open, setOpen } = useDialogContext("DialogContent");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-border bg-background p-5",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-full border border-border/70 p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn("text-base font-semibold text-foreground", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-4 flex items-center justify-end gap-2", className)}>{children}</div>;
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-3 space-y-1", className)}>{children}</div>;
}

export function DialogClose({ children, className }: { children: ReactNode; className?: string }) {
  const { setOpen } = useDialogContext("DialogClose");
  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export function DialogPortal({ children }: { children: ReactNode }) {
  const { open } = useDialogContext("DialogPortal");
  if (!open) return null;
  return <>{Children.only(children)}</>;
}
