export default function CoachProOverview({
  isPremium,
  totals,
  savingsRate,
  budgetUsage,
  goals,
  subscriptions,
  currency,
  money,
  onAsk,
  coachLoading,
}) {
  if (!isPremium) {
    return null;
  }

  const activeGoals = goals.filter(
    (goal) =>
      Number(goal.target || 0) >
      Number(goal.saved || 0)
  );

  const totalGoalRemaining = activeGoals.reduce(
    (sum, goal) =>
      sum +
      Math.max(
        Number(goal.target || 0) -
          Number(goal.saved || 0),
        0
      ),
    0
  );

  const subscriptionExpense = subscriptions.reduce(
    (sum, item) =>
      item.type === "income"
        ? sum
        : sum + Number(item.amount || 0),
    0
  );

  const actions = [
    {
      label: "Finansal durumumu derin analiz et",
      question:
        "Bu ay finansal durumumu derinlemesine analiz et. En önemli fırsatımı, en önemli riskimi ve ilk yapmam gereken tek aksiyonu belirt.",
    },
    {
      label: "Harcama riskimi bul",
      question:
        "Bu ay harcamalarımı ve önceki ay verisini dikkate alarak en önemli harcama riskimi bul. Neye dikkat etmem gerektiğini açıkla.",
    },
    {
      label: "Hedef planımı değerlendir",
      question:
        "Finansal hedeflerimi ve mevcut net akışımı dikkate alarak hedef planımı değerlendir. Verilerime dayanarak en önemli önceliği söyle.",
    },
    {
      label: "Sabit ödemelerimi değerlendir",
      question:
        "Abonelik ve tekrarlayan ödemelerimi değerlendir. Aylık sabit gider yükümün finansal durumuma etkisini ve dikkat etmem gereken noktayı açıkla.",
    },
    {
      label: "Bütçe durumumu değerlendir",
      question:
        "Bu ay bütçe kullanımımı değerlendir. Mevcut bütçe verilerime göre ay sonuna kadar hangi finansal konuya öncelik vermeliyim?",
    },
    {
      label: "6 aylık eğilimimi yorumla",
      question:
        "Son aylardaki finansal eğilimimi değerlendir. Gelir, gider ve net durumdaki önemli değişimi özetle ve tek bir öncelikli aksiyon öner.",
    },
  ];

  return (
    <section className="panel coach-pro-overview">
      <div className="coach-pro-overview-header">
        <div>
          <span className="coach-pro-eyebrow">
            FINANCE COACH PRO 2.0
          </span>
          <h2>
            Finansal durumuna göre daha derin analiz
          </h2>
          <p>
            Gerçek ParaAsistan verilerini kullanarak hazır
            analizlerden birini tek tıkla başlat.
          </p>
        </div>

        <span className="coach-pro-badge">
          PRO 2.0
        </span>
      </div>

      <div className="coach-pro-context">
        <div>
          <span>Bu ay net durum</span>
          <strong
            className={
              totals.balance >= 0
                ? "positive"
                : "negative"
            }
          >
            {money(
              totals.balance,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Tasarruf oranı</span>
          <strong>
            %{Math.round(savingsRate)}
          </strong>
        </div>

        <div>
          <span>Bütçe kullanımı</span>
          <strong>
            {budgetUsage > 0
              ? `%${Math.round(budgetUsage)}`
              : "—"}
          </strong>
        </div>

        <div>
          <span>Aktif hedef</span>
          <strong>
            {activeGoals.length}
          </strong>
        </div>

        <div>
          <span>Hedeflerde kalan</span>
          <strong>
            {money(
              totalGoalRemaining,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Aylık sabit gider</span>
          <strong>
            {money(
              subscriptionExpense,
              currency
            )}
          </strong>
        </div>
      </div>

      <div className="coach-pro-actions">
        {actions.map((action) => (
          <button
            type="button"
            className="secondary-button"
            key={action.label}
            disabled={coachLoading}
            onClick={() => onAsk(action.question)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="coach-pro-note">
        Analizler mevcut finansal kayıtlarına dayanır.
        Eksik veriler olduğunda koç bunu ayrıca belirtmelidir.
      </div>
    </section>
  );
}
