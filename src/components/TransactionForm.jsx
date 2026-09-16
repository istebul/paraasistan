export default function TransactionForm({
  form,
  categories,
  onChange,
  onSubmit,
}) {
  const update = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Yeni İşlem</h2>
            <p>Gelir veya gider ekle</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="form-grid">
          <label>
            Açıklama
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Örn. Market alışverişi"
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
            Kategori
            <select
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tutar
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              placeholder="0"
              required
            />
          </label>

          <label>
            Tarih
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              required
            />
          </label>

          <button className="primary-button" type="submit">
            İşlem Ekle
          </button>
        </form>
      </div>
    </section>
  );
}
