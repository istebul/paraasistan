export default function DashboardSpendingCard({
  month,
  categoryTotals,
  expenseTotal,
  currency,
  money,
  onExport,
}) {
  const safeExpenseTotal = Number(expenseTotal) || 0;

  const topCategory = categoryTotals[0];
  const topCategoryName = topCategory?.[0] || "";
  const topCategoryAmount = Number(topCategory?.[1]) || 0;

  const topCategoryPercent =
    safeExpenseTotal > 0
      ? (topCategoryAmount / safeExpenseTotal) * 100
      : 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Harcama Analizi</h2>
          <p>{month} kategori dağılımı</p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onExport}
        >
          CSV indir
        </button>
      </div>

      {categoryTotals.length === 0 ? (
        <div className="empty-state">
          Bu ay henüz gider kaydı yok.
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid var(--line)",
              background: "rgba(99,102,241,.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <small style={{ opacity: 0.65 }}>
                  En büyük harcama
                </small>

                <strong
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "17px",
                  }}
                >
                  {topCategoryName}
                </strong>
              </div>

              <div style={{ textAlign: "right" }}>
                <strong>
                  {money(
                    topCategoryAmount,
                    currency
                  )}
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "3px",
                    opacity: 0.65,
                  }}
                >
                  %{Math.round(topCategoryPercent)} toplam gider
                </small>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              marginBottom: "10px",
            }}
          >
            <span style={{ opacity: 0.7 }}>
              Toplam gider
            </span>

            <strong>
              {money(
                safeExpenseTotal,
                currency
              )}
            </strong>
          </div>

          <div className="category-list">
            {categoryTotals.map(
              ([category, amount]) => {
                const safeAmount =
                  Number(amount) || 0;

                const percent =
                  safeExpenseTotal > 0
                    ? (safeAmount /
                        safeExpenseTotal) *
                      100
                    : 0;

                return (
                  <div
                    className="category-row"
                    key={category}
                  >
                    <div className="category-info">
                      <strong>{category}</strong>

                      <span>
                        {money(
                          safeAmount,
                          currency
                        )}
                      </span>
                    </div>

                    <div className="progress">
                      <div
                        style={{
                          width: `${Math.min(
                            percent,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <small>
                      %{Math.round(percent)}
                    </small>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}