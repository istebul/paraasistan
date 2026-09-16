import { useEffect } from "react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="status"
      aria-live="polite"
    >
      <span>{toast.type === "error" ? "!" : "✓"}</span>
      <p>{toast.message}</p>
      <button
        type="button"
        aria-label="Bildirimi kapat"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
