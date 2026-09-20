export default function DailyControlCenter({
  month,
  totals,
  budgetUsage,
  budgetRemaining,
  goals = [],
  subscriptions = [],
  financialInsights = [],
  currency,
  money,
  onNavigate,
}) {
  const balance = Number(totals?.balance) || 0;
  const safeBudgetUsage = Math.max(
    0,
    Number(budgetUsage) || 0
  );
  const safeBudgetRemaining =
    Number(budgetRemaining) || 0;

  const firstGoal = goals[0] || null;
  const goalTarget = Number(firstGoal?.target) || 0;
  const goalSaved = Number(firstGoal?.saved) || 0;
  const goalProgress =
    goalTarget > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (goalSaved / goalTarget) * 100
          )
        )
      : 0;

  const expenseSubscriptions = subscriptions.filter(
    (item) => item?.type !== "income"
  );

  const primaryInsight =
    financialInsights[0] || null;

  const todayLabel =
    new Intl.DateTimeFormat("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());

  return (
    <section className="panel daily-control-center">
      <div className="daily-control-header">
        <div>
          <span className="daily-control-eyebrow">
            GÜNLÜK KONTROL
          </span>

          <h2>Bugünün Finans Özeti</h2>

          <p>
            {todayLabel} · {month}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("transactions")}
        >
          İşlemleri Gör
        </button>
      </div>

      <div className="daily-control-grid">
        <div className="daily-control-card">
          <span>Net durum</span>

          <strong
            className={
              balance >= 0
                ? "positive"
                : "negative"
            }
          >
            {balance >= 0 ? "+" : "-"}
            {money(
              Math.abs(balance),
              currency
            )}
          </strong>

          <small>
            Bu ay gelir ve gider farkı
          </small>
        </div>

        <div className="daily-control-card">
          <div className="daily-control-card-top">
            <span>Bütçe</span>

            <strong>
              %{Math.round(safeBudgetUsage)}
            </strong>
          </div>

          <div className="progress">
            <div
              style={{
                width: `${Math.min(
                  safeBudgetUsage,
                  100
                )}%`,
              }}
            />
          </div>

          <small>
            {safeBudgetRemaining >= 0
              ? `Kalan ${money(
                  safeBudgetRemaining,
                  currency
                )}`
              : `Aşım ${money(
                  Math.abs(
                    safeBudgetRemaining
                  ),
                  currency
                )}`}
          </small>
        </div>

        <div className="daily-control-card">
          <span>Öncelikli hedef</span>

          {firstGoal ? (
            <>
              <strong className="daily-control-goal-title">
                {firstGoal.title}
              </strong>

              <div className="progress">
                <div
                  style={{
                    width: `${goalProgress}%`,
                  }}
                />
              </div>

              <small>
                %{Math.round(goalProgress)} tamamlandı
              </small>
            </>
          ) : (
            <>
              <strong>
                Henüz hedef yok
              </strong>

              <small>
                Birikim hedefi oluşturabilirsin.
              </small>
            </>
          )}
        </div>

        <div className="daily-control-card">
          <span>Sabit ödemeler</span>

          <strong>
            {money(
              expenseSubscriptions.reduce(
                (sum, item) =>
                  sum +
                  (Number(item?.amount) || 0),
                0
              ),
              currency
            )}
          </strong>

          <small>
            {expenseSubscriptions.length} aktif abonelik
          </small>
        </div>
      </div>

      {primaryInsight && (
        <div
          className={`daily-control-insight insight-${primaryInsight.type || "info"}`}
        >
          <div>
            <span className="daily-control-insight-label">
              {primaryInsight.type === "danger"
                ? "Dikkat"
                : primaryInsight.type ===
                    "warning"
                  ? "Kontrol"
                  : primaryInsight.type ===
                      "success"
                    ? "Olumlu"
                    : "Bilgi"}
            </span>

            <strong>
              {primaryInsight.title}
            </strong>
          </div>

          <p>{primaryInsight.text}</p>
        </div>
      )}

      <div className="daily-control-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onNavigate("transactions")
          }
        >
          İşlem Ekle
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("budget")}
        >
          Bütçemi Aç
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("goals")}
        >
          Hedeflerim
        </button>
      </div>
    </section>
  );
}
