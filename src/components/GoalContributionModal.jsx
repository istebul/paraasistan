export default function GoalContributionModal({
  goal,
  amount,
  note,
  currency,
  money,
  onAmountChange,
  onNoteChange,
  onSubmit,
  onClose,
}) {
  if (!goal) return null;

  const remaining = Math.max(
    Number(goal.target || 0) - Number(goal.saved || 0),
    0
  );

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="panel edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-contribution-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h2 id="goal-contribution-title">Hedefe Para Ekle</h2>
            <p>{goal.title} · Kalan {money(remaining, currency)}</p>
          </div>
          <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={onClose}>×</button>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Tutar
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Not (isteğe bağlı)
            <input
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Örn. Maaştan ayırdım"
            />
          </label>
          <div className="modal-actions">
            <button className="primary-button" type="submit">Hedefe Ekle</button>
            <button className="secondary-button" type="button" onClick={onClose}>Vazgeç</button>
          </div>
        </form>
      </div>
    </div>
  );
}
