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

  const savingsValue = Number(totals.balance || 0);
  const incomeValue = Number(totals.income || 0);
  const expenseValue = Number(totals.expense || 0);

  const savingsRateValue = Number(savingsRate || 0);

  return (
    <section className="stats-grid">
      <div className="stat-card">
        <span>Aylık Gelir</span>

        <strong className="positive">
          {money(incomeValue, currency)}
        </strong>

        <small>
          {changeText(
            incomeChange,
            "Önceki ay karşılaştırması yok"
          )}
        </small>
      </div>

      <div className="stat-card">
        <span>Aylık Gider</span>

        <strong className="negative">
          {money(expenseValue, currency)}
        </strong>

        <small>
          {changeText(
            expenseChange,
            "Önceki ay karşılaştırması yok"
          )}
        </small>
      </div>

      <div className="stat-card">
        <span>Net Tasarruf</span>

        <strong
          className={
            savingsValue >= 0
              ? "positive"
              : "negative"
          }
        >
          {savingsValue >= 0 ? "+" : "-"}
          {money(Math.abs(savingsValue), currency)}
        </strong>

        <small>
          {changeText(
            savingsChange,
            "Önceki ay karşılaştırması yok"
          )}
        </small>
      </div>

      <div className="stat-card">
        <span>Tasarruf Oranı</span>

        <strong>
          %{Math.round(savingsRateValue)}
        </strong>

        <small>
          Gelirinin ne kadarı kalıyor
        </small>

        <div
          className="progress"
          style={{
            marginTop: "10px",
            height: "6px",
          }}
        >
          <div
            style={{
              width: `${Math.min(
                Math.max(savingsRateValue, 0),
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}