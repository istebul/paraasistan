import { useMemo } from "react";
import { calculateMonthlyForecast } from "../lib/monthlyForecast";

export default function MonthlyForecast({
  transactions = [],
  selectedMonth,
  totals,
  budget,
  currency,
  money,
}) {
  const forecast = useMemo(
    () =>
      calculateMonthlyForecast({
        transactions,
        selectedMonth,
      }),
    [transactions, selectedMonth]
  );

  const actualIncome =
    Number(totals?.income) || 0;

  const actualExpense =
    Number(totals?.expense) || 0;

  const projectedIncome =
    Number(forecast.projectedIncome) ||
    0;

  const projectedExpense =
    Number(forecast.projectedExpense) ||
    0;

  const projectedBalance =
    Number(forecast.projectedBalance) ||
    0;

  const budgetAmount =
    Number(budget) || 0;

  const projectedBudgetUsage =
    budgetAmount > 0
      ? (projectedExpense / budgetAmount) *
        100
      : null;

  const isCurrent =
    forecast.mode === "current";

  if (forecast.mode === "unavailable") {
    return null;
  }

  return (
    <section className="panel monthly-forecast-panel">
      <div className="monthly-forecast-header">
        <div>
          <span className="monthly-forecast-eyebrow">
            FİNANSAL ÖNGÖRÜ
          </span>

          <h2>
            {isCurrent
              ? "Ay sonunda görünümün"
              : "Ay sonu görünümü"}
          </h2>

          <p>
            {isCurrent
              ? `Mevcut kayıt temposu korunursa ay sonunda oluşabilecek tablo. ${forecast.elapsedDays}/${forecast.daysInMonth} gün işlendi.`
              : "Seçili ay geçmişte olduğu için tahmin yerine gerçekleşen sonuç gösteriliyor."}
          </p>
        </div>

        <span className="monthly-forecast-badge">
          {isCurrent
            ? "TAHMİN"
            : "GERÇEKLEŞEN"}
        </span>
      </div>

      <div className="monthly-forecast-grid">
        <div className="monthly-forecast-card">
          <span>Gelir</span>

          <strong>
            {money(
              projectedIncome,
              currency
            )}
          </strong>

          <small>
            Gerçekleşen{" "}
            {money(
              actualIncome,
              currency
            )}
          </small>
        </div>

        <div className="monthly-forecast-card">
          <span>Gider</span>

          <strong>
            {money(
              projectedExpense,
              currency
            )}
          </strong>

          <small>
            Gerçekleşen{" "}
            {money(
              actualExpense,
              currency
            )}
          </small>
        </div>

        <div className="monthly-forecast-card">
          <span>Net bakiye</span>

          <strong
            className={
              projectedBalance >= 0
                ? "positive"
                : "negative"
            }
          >
            {projectedBalance >= 0
              ? "+"
              : "-"}
            {money(
              Math.abs(projectedBalance),
              currency
            )}
          </strong>

          <small>
            Tahmini ay sonu sonucu
          </small>
        </div>

        <div className="monthly-forecast-card">
          <span>Bütçe görünümü</span>

          {projectedBudgetUsage !==
          null ? (
            <>
              <strong
                className={
                  projectedBudgetUsage >=
                  100
                    ? "negative"
                    : projectedBudgetUsage >=
                        80
                      ? "warning"
                      : "positive"
                }
              >
                %{Math.round(
                  projectedBudgetUsage
                )}
              </strong>

              <div className="progress">
                <div
                  style={{
                    width: `${Math.min(
                      projectedBudgetUsage,
                      100
                    )}%`,
                  }}
                />
              </div>

              <small>
                {projectedBudgetUsage >=
                100
                  ? "Tahmini bütçe aşımı"
                  : "Tahmini bütçe kullanımı"}
              </small>
            </>
          ) : (
            <>
              <strong>
                Bütçe yok
              </strong>

              <small>
                Öngörülen gider için bütçe tanımlayabilirsin.
              </small>
            </>
          )}
        </div>
      </div>

      {isCurrent && (
        <div className="monthly-forecast-note">
          Bu değerler mevcut kayıt hızının ay
          sonuna kadar devam edeceği varsayımıyla
          hesaplanır; gerçek sonuçlar gelir ve
          giderlerin zamanlamasına göre değişebilir.
        </div>
      )}
    </section>
  );
}
