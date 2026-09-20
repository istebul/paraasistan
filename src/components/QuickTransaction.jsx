export default function QuickTransaction({
  form,
  categories,
  onChange,
  onSubmit,
}) {
  const update = (field, value) => {
    onChange({
      ...form,
      [field]: value,
    });
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
    <section className="panel quick-transaction-panel">
      <div className="panel-header">
        <div>
          <span className="quick-transaction-eyebrow">
            HIZLI İŞLEM
          </span>

          <h2>Gelir veya gider ekle</h2>

          <p>
            Günlük hareketini dashboard'dan ayrılmadan kaydet.
          </p>
        </div>

        <span className="quick-transaction-date">
          {form.date}
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        className="quick-transaction-form"
      >
        <div className="quick-type-switch">
          <button
            type="button"
            className={
              form.type === "expense"
                ? "primary-button"
                : "secondary-button"
            }
            onClick={() =>
              update("type", "expense")
            }
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
            onClick={() =>
              update("type", "income")
            }
          >
            Gelir
          </button>
        </div>

        <label>
          Açıklama
          <input
            value={form.title}
            onChange={(event) =>
              update(
                "title",
                event.target.value
              )
            }
            placeholder="Örn. Market"
            autoComplete="off"
            required
          />
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
              update(
                "amount",
                event.target.value
              )
            }
            placeholder="0,00"
            required
          />
        </label>

        <label>
          Kategori
          <select
            value={form.category}
            onChange={(event) =>
              update(
                "category",
                event.target.value
              )
            }
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="secondary-button quick-today-button"
          onClick={setToday}
        >
          Bugün
        </button>

        <button
          type="submit"
          className="primary-button quick-submit-button"
        >
          + İşlem Ekle
        </button>
      </form>
    </section>
  );
}
