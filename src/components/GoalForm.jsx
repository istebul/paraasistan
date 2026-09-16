export default function GoalForm({ form, onChange, onSubmit }) {
  const update = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Yeni Hedef</h2>
          <p>Bir finansal hedef oluştur</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Hedef adı
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Örn. Acil durum fonu"
            required
          />
        </label>
        <label>
          Hedef tutar
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.target}
            onChange={(event) => update("target", event.target.value)}
            required
          />
        </label>
        <label>
          Biriken tutar
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.saved}
            onChange={(event) => update("saved", event.target.value)}
          />
        </label>
        <label>
          Son tarih
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => update("deadline", event.target.value)}
          />
        </label>
        <button className="primary-button" type="submit">Hedef Ekle</button>
      </form>
    </div>
  );
}
