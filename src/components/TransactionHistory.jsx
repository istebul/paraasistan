import TransactionFilters from "./TransactionFilters";

export default function TransactionHistory({
  results,
  total,
  categories,
  search,
  type,
  category,
  currency,
  money,
  dateText,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onExport,
  onEdit,
  onDelete,
}) {
  const filteredIncome = results
    .filter((item) => item.type === "income")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const filteredExpense = results
    .filter((item) => item.type === "expense")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const filteredBalance =
    filteredIncome - filteredExpense;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>İşlem Geçmişi</h2>
          <p>
            {results.length} sonuç / {total} toplam kayıt
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onExport}
        >
          CSV indir
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
            background: "rgba(34,197,94,.06)",
          }}
        >
          <small style={{ opacity: 0.65 }}>
            Filtrelenen gelir
          </small>

          <strong
            className="positive"
            style={{
              display: "block",
              marginTop: "4px",
              fontSize: "16px",
            }}
          >
            +{money(filteredIncome, currency)}
          </strong>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
            background: "rgba(239,68,68,.06)",
          }}
        >
          <small style={{ opacity: 0.65 }}>
            Filtrelenen gider
          </small>

          <strong
            className="negative"
            style={{
              display: "block",
              marginTop: "4px",
              fontSize: "16px",
            }}
          >
            -{money(filteredExpense, currency)}
          </strong>
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
            background: "rgba(99,102,241,.06)",
          }}
        >
          <small style={{ opacity: 0.65 }}>
            Filtrelenen bakiye
          </small>

          <strong
            className={
              filteredBalance >= 0
                ? "positive"
                : "negative"
            }
            style={{
              display: "block",
              marginTop: "4px",
              fontSize: "16px",
            }}
          >
            {filteredBalance >= 0 ? "+" : "-"}
            {money(
              Math.abs(filteredBalance),
              currency
            )}
          </strong>
        </div>
      </div>

      <TransactionFilters
        categories={categories}
        search={search}
        type={type}
        category={category}
        onSearchChange={onSearchChange}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
      />

      {results.length === 0 ? (
        <div className="empty-state">
          <strong>İşlem bulunamadı</strong>
          <p style={{ margin: "6px 0 0", opacity: 0.7 }}>
            Arama veya filtre kriterlerini değiştirerek
            tekrar deneyebilirsin.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Açıklama</th>
                <th>Tür</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                  </td>

                  <td>
                    <span
                      className={
                        item.type === "income"
                          ? "positive"
                          : "negative"
                      }
                    >
                      {item.type === "income"
                        ? "Gelir"
                        : "Gider"}
                    </span>
                  </td>

                  <td>{item.category}</td>

                  <td>{dateText(item.date)}</td>

                  <td
                    className={
                      item.type === "income"
                        ? "positive"
                        : "negative"
                    }
                  >
                    {item.type === "income"
                      ? "+"
                      : "-"}
                    {money(item.amount, currency)}
                  </td>

                  <td>
                    <div className="transaction-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => onEdit(item)}
                      >
                        Düzenle
                      </button>

                      <button
                        className="delete-button"
                        type="button"
                        onClick={() =>
                          onDelete(item.id)
                        }
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}