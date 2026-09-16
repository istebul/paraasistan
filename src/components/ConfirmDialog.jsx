import { useEffect } from "react";

export default function ConfirmDialog({ dialog, onClose }) {
  useEffect(() => {
    if (!dialog) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog, onClose]);

  if (!dialog) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => onClose(false)}>
      <div
        className="panel confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title">Emin misin?</h2>
        <p>{dialog.message}</p>
        <div className="modal-actions">
          <button type="button" className="delete-button" onClick={() => onClose(true)}>
            Sil
          </button>
          <button type="button" className="secondary-button" onClick={() => onClose(false)}>
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
