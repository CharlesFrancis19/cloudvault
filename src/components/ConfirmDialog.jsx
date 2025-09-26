// src/components/ConfirmDialog.jsx
import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl glass-effect bg-white shadow-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onCancel}
              disabled={loading}
              className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-slate-600">{message}</p>
          </div>

          <div className="p-4 flex justify-end gap-2 border-t">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-white disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md shadow-sm transition
                ${danger
                  ? "text-white bg-red-600 hover:bg-red-700"
                  : "text-white bg-indigo-600 hover:bg-indigo-700"}
                disabled:opacity-50`}
            >
              {loading ? "Working…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
