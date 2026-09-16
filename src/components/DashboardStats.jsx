export default function DashboardStats({
  totals,
  currency,
  incomeChange,
  expenseChange,
  savingsChange,
  savingsRate,
  money,
}) {
  const changeText = (value, emptyText) => {
    if (value === null) return emptyText;
    return value >= 0
      ? `Önceki aya göre %${Math.round(value)} artış`
      : `Önceki aya göre %${Math.round(Math.abs(value))} düşüş`;
  };

  return (
    <section className="stats-grid">
      <div className="stat-card">
        <span>Aylık Gelir</span>
        <strong>{money(totals.income, currency)}</strong>
        <small>{changeText(incomeChange, "Önceki ay karşılaştırması yok")}</small>
      </div>

      <div className="stat-card">
        <span>Aylık Gider</span>
        <strong>{money(totals.expense, currency)}</strong>
        <small>{changeText(expenseChange, "Önceki ay karşılaştırması yok")}</small>
      </div>

      <div className="stat-card">
        <span>Net Tasarruf</span>
        <strong className={totals.balance >= 0 ? "positive" : "negative"}>
          {money(totals.balance, currency)}
        </strong>
        <small>{changeText(savingsChange, "Önceki ay karşılaştırması yok")}</small>
      </div>

      <div className="stat-card">
        <span>Tasarruf Oranı</span>
        <strong>{Math.round(savingsRate)}%</strong>
        <small>Gelirinin ne kadarı kalıyor</small>
      </div>
    </section>
  );
}
