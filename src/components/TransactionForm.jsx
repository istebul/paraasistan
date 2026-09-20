export default function TransactionForm({
  form,
  categories,
  onChange,
  onSubmit,
}) {
  const update = (field, value) => {
    onChange({ ...form, [field]: value });
  };

  const setType = (type) => {
    update("type", type);
  };

  const setToday = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find(
      (part) => part.type === "year"
    )?.value;

    const month = parts.find(
      (part) => part.type === "month"
    )?.value;

    const day = parts.find(
      (part) => part.type === "day"
    )?.value;

    if (!year || !month || !day) return;

    update("date", `${year}-${month}-${day}`);
  };

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Yeni İşlem</h2>
            <p>Gelir veya giderini hızlıca kaydet</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="form-grid">
          <label>
            Açıklama
            <input
              value={form.title}
              onChange={(event) =>
                update("title", event.target.value)
              }
              placeholder="Örn. Market alışverişi"
              autoComplete="off"
              required
            />
          </label>

          <label>
            Tür
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              <button
                type="button"
                className={
                  form.type === "expense"
                    ? "primary-button"
                    : "secondary-button"
                }
                onClick={() => setType("expense")}
              >
                Gider
              </button>

              <button
                type="button"
                className={
                  form.type === "income"
                    ? "primary-button"
                    : "secondary-button"
                }
                onClick={() => setType("income")}
              >
                Gelir
              </button>
            </div>
          </label>

          <label>
            Kategori
            <select
              value={form.category}
              onChange={(event) =>
                update("category", event.target.value)
              }
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
              inputMode="decimal"
              value={form.amount}
              onChange={(event) =>
                update("amount", event.target.value)
              }
              placeholder="0,00"
              required
            />
          </label>

          <label>
            Tarih
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  update("date", event.target.value)
                }
                required
                style={{ flex: 1 }}
              />

              <button
                type="button"
                className="secondary-button"
                onClick={setToday}
                title="Bugünün tarihini seç"
              >
                Bugün
              </button>
            </div>
          </label>

          <button className="primary-button" type="submit">
            + İşlem Ekle
          </button>
        </form>
      </div>
    </section>
  );
}