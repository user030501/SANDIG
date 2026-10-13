import * as React from "react";
import { X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-sm text-gray-600 mb-5">{children}</div>
        {actions ?? (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
