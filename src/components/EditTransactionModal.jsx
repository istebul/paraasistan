export default function EditTransactionModal({
  transaction,
  categories,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!transaction) return null;

  const update = (field, value) => onChange({ ...transaction, [field]: value });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="panel edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h2 id="edit-transaction-title">İşlemi Düzenle</h2>
            <p>Finansal işlem bilgilerini güncelle.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Pencereyi kapat" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit} className="form-grid">
          <label>
            Açıklama
            <input value={transaction.title || ""} onChange={(event) => update("title", event.target.value)} required />
          </label>
          <label>
            Tür
            <select value={transaction.type} onChange={(event) => update("type", event.target.value)}>
              <option value="expense">Gider</option>
              <option value="income">Gelir</option>
            </select>
          </label>
          <label>
            Kategori
            <select value={transaction.category} onChange={(event) => update("category", event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Tutar
            <input type="number" min="0" step="0.01" value={transaction.amount || ""} onChange={(event) => update("amount", event.target.value)} required />
          </label>
          <label>
            Tarih
            <input type="date" value={transaction.date || ""} onChange={(event) => update("date", event.target.value)} required />
          </label>
          <div className="modal-actions">
            <button type="submit" className="primary-button">Değişiklikleri Kaydet</button>
            <button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button>
          </div>
        </form>
      </div>
    </div>
  );
}
