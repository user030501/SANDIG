import * as React from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "./utils";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setToasts((items) => items.filter((t) => t.id !== id));
  }, []);

  const notify = React.useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextToastId++;
      setToasts((items) => [...items, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[22rem] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg bg-white",
              t.variant === "success" ? "border-green-200 text-green-800" : "border-red-200 text-red-800"
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
