export function DashboardHealthCard({
  score,
  label,
  message,
  savingsRate,
  budgetUsage,
  goals,
}) {
  const safeScore = Math.min(
    100,
    Math.max(0, Number(score) || 0)
  );

  const safeSavingsRate = Number(savingsRate) || 0;
  const safeBudgetUsage = Math.max(
    0,
    Number(budgetUsage) || 0
  );

  const goalProgress =
    goals.length > 0
      ? Math.round(
          (goals.reduce((sum, goal) => {
            const target = Number(goal.target) || 0;
            const saved = Number(goal.saved) || 0;

            return (
              sum +
              (target > 0
                ? Math.min(saved / target, 1)
                : 0)
            );
          }, 0) /
            goals.length) *
            100
        )
      : null;

  const getStatusText = () => {
    if (safeScore >= 80) return "Çok iyi";
    if (safeScore >= 60) return "İyi";
    if (safeScore >= 40) return "Dikkat";
    return "Geliştirilebilir";
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Finansal Sağlık</h2>
          <p>Bu ayki finansal davranışlarının özeti</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "28px" }}>
            {Math.round(safeScore)}/100
          </strong>

          <small
            style={{
              display: "block",
              marginTop: "2px",
              opacity: 0.65,
            }}
          >
            {getStatusText()}
          </small>
        </div>
      </div>

      <div
        className="progress large"
        style={{ marginTop: "16px" }}
      >
        <div
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>

      <div className="health-summary">
        <strong>{label}</strong>
        <span>{message}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <div className="health-indicator">
          <small>Tasarruf</small>
          <strong>
            %{Math.round(safeSavingsRate)}
          </strong>
        </div>

        <div className="health-indicator">
          <small>Bütçe</small>
          <strong>
            %{Math.round(safeBudgetUsage)}
          </strong>
        </div>

        <div className="health-indicator">
          <small>Hedefler</small>
          <strong>
            {goalProgress === null
              ? "Hedef yok"
              : `%${goalProgress}`}
          </strong>
        </div>
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
  const safeUsage = Math.max(
    0,
    Number(usage) || 0
  );

  const safeRemaining = Number(remaining) || 0;

  const progressWidth = Math.min(
    safeUsage,
    100
  );

  const getBudgetStatus = () => {
    if (safeUsage > 100) return "Bütçe aşıldı";
    if (safeUsage >= 90) return "Kritik seviye";
    if (safeUsage >= 80) return "Dikkat";
    return "Kontrollü";
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Bütçe Durumu</h2>
          <p>{month}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "28px" }}>
            %{Math.round(safeUsage)}
          </strong>

          <small
            style={{
              display: "block",
              marginTop: "2px",
              opacity: 0.65,
            }}
          >
            {getBudgetStatus()}
          </small>
        </div>
      </div>

      <div
        className="progress large"
        style={{ marginTop: "16px" }}
      >
        <div
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginTop: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ opacity: 0.75 }}>
          {safeRemaining >= 0
            ? "Kalan bütçe"
            : "Bütçe aşımı"}
        </span>

        <strong
          className={
            safeRemaining >= 0
              ? "positive"
              : "negative"
          }
        >
          {money(
            Math.abs(safeRemaining),
            currency
          )}
        </strong>
      </div>
    </div>
  );
}