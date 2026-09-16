export default function SubscriptionForm({ form, onChange, onSubmit }) {
  const update = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Yeni Abonelik</h2>
          <p>Düzenli ödemelerini takip et</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Abonelik adı
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Örn. İnternet"
            required
          />
        </label>
        <label>
          Tür
          <select
            value={form.type}
            onChange={(event) => update("type", event.target.value)}
          >
            <option value="expense">Gider</option>
            <option value="income">Gelir</option>
          </select>
        </label>
        <label>
          Aylık tutar
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => update("amount", event.target.value)}
            required
          />
        </label>
        <label>
          Ödeme günü
          <input
            type="number"
            min="1"
            max="31"
            value={form.day}
            onChange={(event) => update("day", event.target.value)}
            required
          />
        </label>
        <button className="primary-button" type="submit">Abonelik Ekle</button>
      </form>
    </div>
  );
}
