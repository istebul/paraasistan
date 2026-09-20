import {
  analyzeSubscriptionIntelligence,
} from "../lib/subscriptionIntelligence.js";

export default function SubscriptionIntelligence({
  subscriptions,
  currency,
  money,
  onOpenSubscriptions,
}) {
  const result =
    analyzeSubscriptionIntelligence({
      subscriptions,
    });

  const nextPaymentLabel = (item) => {
    if (!item) return "Yaklaşan ödeme yok";

    if (item.daysUntil === 0) return "Bugün";
    if (item.daysUntil === 1) return "Yarın";

    return `${item.daysUntil} gün kaldı`;
  };

  return (
    <section className="panel subscription-intelligence-card">
      <div className="panel-header">
        <div>
          <h2>
            Abonelik ve Tekrarlayan Ödeme Zekâsı
          </h2>
          <p>
            Sabit gelir ve giderlerini daha görünür
            hale getir.
          </p>
        </div>

        <span className="subscription-intelligence-badge">
          ZEKÂ
        </span>
      </div>

      {result.totalCount === 0 ? (
        <div className="empty-state">
          Henüz analiz edilecek abonelik bulunmuyor.
          {onOpenSubscriptions && (
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenSubscriptions}
            >
              Aboneliklere git
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="subscription-intelligence-summary">
            <div>
              <span>Aylık sabit gider</span>
              <strong>
                {money(
                  result.monthlyExpense,
                  currency
                )}
              </strong>
            </div>

            <div>
              <span>Aylık sabit gelir</span>
              <strong>
                {money(
                  result.monthlyIncome,
                  currency
                )}
              </strong>
            </div>

            <div>
              <span>Sabit net</span>
              <strong
                className={
                  result.monthlyNet >= 0
                    ? "positive"
                    : "negative"
                }
              >
                {result.monthlyNet >= 0
                  ? "+"
                  : ""}
                {money(
                  result.monthlyNet,
                  currency
                )}
              </strong>
            </div>

            <div>
              <span>Gelirin gider karşılama oranı</span>
              <strong>
                {result.incomeCoverage === null
                  ? "Hesaplanamıyor"
                  : `%${Math.round(
                      result.incomeCoverage
                    )}`}
              </strong>
            </div>
          </div>

          {result.nextPayment && (
            <div className="subscription-intelligence-focus">
              <div>
                <small>En yakın ödeme</small>
                <strong>
                  {result.nextPayment.title}
                </strong>
                <span>
                  {result.nextPayment.type ===
                  "income"
                    ? "Gelir"
                    : "Gider"}{" "}
                  · Her ayın{" "}
                  {result.nextPayment.day}. günü
                </span>
              </div>

              <div>
                <strong>
                  {money(
                    result.nextPayment.amount,
                    currency
                  )}
                </strong>
                <small>
                  {nextPaymentLabel(
                    result.nextPayment
                  )}
                </small>
              </div>
            </div>
          )}

          {result.upcomingSevenDaysCount > 0 && (
            <div className="subscription-intelligence-alert">
              Önümüzdeki 7 günde{" "}
              <strong>
                {result.upcomingSevenDaysCount}
              </strong>{" "}
              sabit ödeme/giriş planlanıyor.
            </div>
          )}

          {result.largestExpense && (
            <div className="subscription-intelligence-row">
              <div>
                <span>En yüksek sabit gider</span>
                <strong>
                  {result.largestExpense.title}
                </strong>
              </div>

              <strong>
                {money(
                  result.largestExpense.amount,
                  currency
                )}
              </strong>
            </div>
          )}

          <div className="subscription-intelligence-note">
            Bu analiz mevcut abonelik kayıtlarına dayanır.
            Gerçek ödeme tarihleri veya tutarları değişirse
            sonuçlar da değişebilir.
          </div>

          {onOpenSubscriptions && (
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenSubscriptions}
            >
              Sabit ödemeleri görüntüle
            </button>
          )}
        </>
      )}
    </section>
  );
}
