export function DashboardHealthCard({ score, label, message }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Finansal Sağlık</h2>
          <p>Bu ayki finansal davranışlarının özeti</p>
        </div>
        <strong style={{ fontSize: "28px" }}>{score}/100</strong>
      </div>

      <div className="progress large" style={{ marginTop: "16px" }}>
        <div style={{ width: `${score}%` }} />
      </div>

      <div className="health-summary">
        <strong>{label}</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}

export function DashboardBudgetCard({
  month,
  usage,
  remaining,
  currency,
  money,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Bütçe Durumu</h2>
          <p>{month}</p>
        </div>
        <strong>%{Math.round(usage)}</strong>
      </div>

      <div className="progress large" style={{ marginTop: "16px" }}>
        <div style={{ width: `${Math.min(usage, 100)}%` }} />
      </div>

      <p style={{ marginTop: "12px" }}>
        {remaining >= 0
          ? `Kalan: ${money(remaining, currency)}`
          : `Aşım: ${money(Math.abs(remaining), currency)}`}
      </p>
    </div>
  );
}
