import {
  calculateSavingsPlan,
} from "../lib/savingsPlan.js";

export default function SavingsPlan({
  goals,
  totals,
  currency,
  money,
  daysUntil,
  onOpenGoals,
}) {
  const plan = calculateSavingsPlan({
    goals,
    totals,
    daysUntil,
  });

  return (
    <section className="savings-plan-card panel">
      <div className="panel-header">
        <div>
          <h2>Akıllı Tasarruf Planı</h2>
          <p>
            Mevcut ay verilerine göre hedeflerin için
            hesaplanabilir birikim planı.
          </p>
        </div>

        <span className="savings-plan-badge">
          PLAN
        </span>
      </div>

      {plan.status === "empty" ? (
        <div className="empty-state">
          Tasarruf planı oluşturmak için önce bir hedef
          ekle.
          {onOpenGoals && (
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenGoals}
            >
              Hedeflere git
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="savings-plan-stats">
            <div>
              <span>Bu ay net birikim</span>
              <strong>
                {money(plan.balance, currency)}
              </strong>
            </div>
            <div>
              <span>Aylık ayırılabilir kapasite</span>
              <strong>
                {money(
                  plan.monthlyCapacity,
                  currency
                )}
              </strong>
            </div>
            <div>
              <span>Aktif hedef</span>
              <strong>
                {plan.activeGoalCount}
              </strong>
            </div>
            <div>
              <span>Toplam kalan</span>
              <strong>
                {money(
                  plan.totalRemaining,
                  currency
                )}
              </strong>
            </div>
          </div>

          <div
            className={`savings-plan-detail savings-plan-${plan.status}`}
          >
            <div className="savings-plan-detail-top">
              <div>
                <span>Öncelikli hedef</span>
                <strong>
                  {plan.priorityGoal.title}
                </strong>
              </div>

              {plan.priorityGoal.deadline && (
                <span>
                  {plan.priorityGoal.daysRemaining < 0
                    ? "Süre geçti"
                    : plan.priorityGoal.daysRemaining === 0
                      ? "Bugün"
                      : `${plan.priorityGoal.daysRemaining} gün kaldı`}
                </span>
              )}
            </div>

            <div className="savings-plan-values">
              <div>
                <span>Kalan tutar</span>
                <strong>
                  {money(
                    plan.priorityGoal.remaining,
                    currency
                  )}
                </strong>
              </div>

              {plan.requiredMonthly !== null ? (
                <>
                  <div>
                    <span>
                      {plan.priorityGoal.daysRemaining <= 30
                        ? "Gereken günlük katkı"
                        : "Gereken aylık katkı"}
                    </span>
                    <strong>
                      {money(
                        plan.priorityGoal.daysRemaining <= 30
                          ? plan.requiredDaily
                          : plan.requiredMonthly,
                        currency
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Gereken haftalık katkı</span>
                    <strong>
                      {money(
                        plan.requiredWeekly,
                        currency
                      )}
                    </strong>
                  </div>
                </>
              ) : (
                <div>
                  <span>Mevcut aylık kapasite</span>
                  <strong>
                    {money(
                      plan.monthlyCapacity,
                      currency
                    )}
                  </strong>
                </div>
              )}
            </div>

            <p>
              {plan.status === "on-track" &&
                `Mevcut aylık kapasiten, hedef için gereken ${money(
                  plan.requiredMonthly,
                  currency
                )} tutarı karşılıyor.`}

              {plan.status === "gap" &&
                (plan.priorityGoal.daysRemaining <= 30
                  ? `Hedefe ulaşmak için kalan ${plan.priorityGoal.daysRemaining} gün içinde ${money(
                      plan.priorityGoal.remaining,
                      currency
                    )} biriktirmen gerekir. Günlük yaklaşık ${money(
                      plan.requiredDaily,
                      currency
                    )} katkı gerekir.`
                  : `Hedefe zamanında ulaşmak için aylık yaklaşık ${money(
                      plan.requiredMonthly,
                      currency
                    )} gerekir. Mevcut kapasite ile aylık eşdeğer fark ${money(
                      plan.capacityGap,
                      currency
                    )}.`)}

              {plan.status === "overdue" &&
                "Bu hedefin son tarihi geçmiş. Yeni bir tarih belirleyerek planı güncellemen daha sağlıklı olur."}

              {plan.status === "no-deadline" &&
                `Bu hedef için son tarih belirlenmemiş. Mevcut aylık kapasiten ${money(
                  plan.monthlyCapacity,
                  currency
                )}.`}
            </p>
          </div>

          <div className="savings-plan-note">
            Hesaplama mevcut ayın net birikim kapasitesini
            ve hedef tarihini kullanır. Gerçek sonuçlar gelir
            ve gider değişimlerine göre farklılık gösterebilir.
          </div>

          {onOpenGoals && (
            <button
              className="secondary-button"
              type="button"
              onClick={onOpenGoals}
            >
              Hedefleri görüntüle
            </button>
          )}
        </>
      )}
    </section>
  );
}
