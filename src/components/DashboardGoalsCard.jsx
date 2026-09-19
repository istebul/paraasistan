export default function DashboardGoalsCard({
  goals,
  currency,
  money,
  onOpenGoals,
}) {
  const visibleGoals = goals.slice(0, 3);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Hedef Özeti</h2>
          <p>Finansal hedeflerin</p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onOpenGoals}
        >
          Hedefleri Gör
        </button>
      </div>

      {visibleGoals.length === 0 ? (
        <div className="empty-state">
          <strong>Henüz finansal hedef oluşturmadın.</strong>
          <p
            style={{
              margin: "6px 0 0",
              opacity: 0.7,
            }}
          >
            Bir hedef oluşturarak birikimlerini takip
            etmeye başlayabilirsin.
          </p>
        </div>
      ) : (
        <div className="goal-list">
          {visibleGoals.map((goal) => {
            const target =
              Number(goal.target) || 0;

            const saved =
              Number(goal.saved) || 0;

            const progress =
              target > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (saved / target) * 100
                    )
                  )
                : 0;

            const completed =
              target > 0 && saved >= target;

            const remaining =
              Math.max(target - saved, 0);

            return (
              <div
                className="goal-card"
                key={goal.id}
              >
                <div className="goal-top">
                  <div>
                    <strong>{goal.title}</strong>

                    <span>
                      {money(saved, currency)} /{" "}
                      {money(target, currency)}
                    </span>
                  </div>

                  <strong
                    className={
                      completed
                        ? "positive"
                        : undefined
                    }
                  >
                    %{Math.round(progress)}
                  </strong>
                </div>

                <div
                  className="progress large"
                  style={{ marginTop: "10px" }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <small
                    style={{
                      opacity: 0.65,
                    }}
                  >
                    {completed
                      ? "Hedef tamamlandı"
                      : `Kalan: ${money(
                          remaining,
                          currency
                        )}`}
                  </small>

                  {completed && (
                    <small className="positive">
                      Tamamlandı
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {goals.length > 3 && (
        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            opacity: 0.6,
            fontSize: "13px",
          }}
        >
          +{goals.length - 3} hedef daha
        </p>
      )}
    </div>
  );
}