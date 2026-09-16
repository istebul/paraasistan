export default function DashboardSpendingCard({
  month,
  categoryTotals,
  expenseTotal,
  currency,
  money,
  onExport,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Harcama Analizi</h2>
          <p>{month} kategori dağılımı</p>
        </div>
        <button className="secondary-button" type="button" onClick={onExport}>
          CSV indir
        </button>
      </div>

      {categoryTotals.length === 0 ? (
        <div className="empty-state">Bu ay henüz gider kaydı yok.</div>
      ) : (
        <div className="category-list">
          {categoryTotals.map(([category, amount]) => {
            const percent = expenseTotal > 0
              ? (amount / expenseTotal) * 100
              : 0;

            return (
              <div className="category-row" key={category}>
                <div className="category-info">
                  <strong>{category}</strong>
                  <span>{money(amount, currency)}</span>
                </div>
                <div className="progress">
                  <div style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <small>%{Math.round(percent)}</small>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
