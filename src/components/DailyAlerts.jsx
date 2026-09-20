export default function DailyAlerts({
  totals,
  budgetUsage,
  budgetRemaining,
  expenseChange,
  savingsRate,
  goals = [],
  subscriptions = [],
  currency,
  money,
  onNavigate,
}) {
  const alerts = [];

  const income = Number(totals?.income) || 0;
  const expense = Number(totals?.expense) || 0;
  const balance = Number(totals?.balance) || 0;
  const usage = Number(budgetUsage) || 0;
  const remaining = Number(budgetRemaining) || 0;
  const change = Number(expenseChange) || 0;
  const savings = Number(savingsRate) || 0;

  const addAlert = (
    type,
    label,
    title,
    text,
    actionLabel,
    actionPage
  ) => {
    alerts.push({
      type,
      label,
      title,
      text,
      actionLabel,
      actionPage,
    });
  };

  if (usage >= 100) {
    addAlert(
      "danger",
      "KRİTİK",
      "Bütçe aşıldı",
      `Bütçenin %${Math.round(
        usage
      )}'ini kullandın. ${
        remaining < 0
          ? `${money(
              Math.abs(remaining),
              currency
            )} aşım var.`
          : "Harcamalarını gözden geçirmen faydalı olabilir."
      }`,
      "Bütçeyi Aç",
      "budget"
    );
  } else if (usage >= 80) {
    addAlert(
      "warning",
      "DİKKAT",
      "Bütçe sınırına yaklaşıyorsun",
      `Bütçenin %${Math.round(
        usage
      )}'ini kullandın. ${
        remaining > 0
          ? `${money(
              remaining,
              currency
            )} kullanılabilir alan kaldı.`
          : "Harcamalarını kontrollü tutman önemli."
      }`,
      "Bütçeyi Aç",
      "budget"
    );
  }

  if (balance < 0) {
    addAlert(
      "danger",
      "DİKKAT",
      "Aylık bakiye negatif",
      `Bu ay giderlerin gelirlerinden ${money(
        Math.abs(balance),
        currency
      )} daha yüksek.`,
      "İşlemleri Gör",
      "transactions"
    );
  } else if (income === 0 && expense > 0) {
    addAlert(
      "warning",
      "KONTROL",
      "Gelir kaydı eksik",
      "Bu ay giderlerin bulunuyor ancak gelir kaydı görünmüyor. Gelirlerini eklemek analizini daha sağlıklı hale getirir.",
      "Gelir Ekle",
      "transactions"
    );
  }

  if (change >= 20 && expense > 0) {
    addAlert(
      "warning",
      "HARCAMA",
      "Giderlerin yükseldi",
      `Giderlerin önceki döneme göre yaklaşık %${Math.round(
        change
      )} daha yüksek görünüyor.`,
      "Harcama Analizi",
      "reports"
    );
  }

  const todayParts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const todayYear = Number(
    todayParts.find(
      (part) => part.type === "year"
    )?.value
  );

  const todayMonth = Number(
    todayParts.find(
      (part) => part.type === "month"
    )?.value
  );

  const todayDay = Number(
    todayParts.find(
      (part) => part.type === "day"
    )?.value
  );

  const todayUtc = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const upcomingPayment = subscriptions
    .filter(
      (item) => item?.type !== "income"
    )
    .map((item) => {
      const paymentDay = Number(item?.day);

      if (
        !Number.isInteger(paymentDay) ||
        paymentDay < 1 ||
        paymentDay > 31
      ) {
        return null;
      }

      const daysInCurrentMonth = new Date(
        Date.UTC(
          todayYear,
          todayMonth,
          0
        )
      ).getUTCDate();

      const currentDueDay = Math.min(
        paymentDay,
        daysInCurrentMonth
      );

      let dueUtc = Date.UTC(
        todayYear,
        todayMonth - 1,
        currentDueDay
      );

      if (dueUtc < todayUtc) {
        const nextMonthDate = new Date(
          Date.UTC(
            todayYear,
            todayMonth,
            1
          )
        );

        const nextYear =
          nextMonthDate.getUTCFullYear();

        const nextMonth =
          nextMonthDate.getUTCMonth() + 1;

        const daysInNextMonth =
          new Date(
            Date.UTC(
              nextYear,
              nextMonth,
              0
            )
          ).getUTCDate();

        dueUtc = Date.UTC(
          nextYear,
          nextMonth - 1,
          Math.min(
            paymentDay,
            daysInNextMonth
          )
        );
      }

      const daysUntil = Math.ceil(
        (dueUtc - todayUtc) /
          86400000
      );

      return {
        item,
        daysUntil,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) => a.daysUntil - b.daysUntil
    )[0];

  if (
    upcomingPayment &&
    upcomingPayment.daysUntil <= 7
  ) {
    const title =
      upcomingPayment.daysUntil === 0
        ? "Bugün sabit ödeme var"
        : `Sabit ödeme ${
            upcomingPayment.daysUntil
          } gün içinde`;

    const text =
      upcomingPayment.item?.title ||
      "Yaklaşan ödeme";

    const amount = Number(
      upcomingPayment.item?.amount
    ) || 0;

    addAlert(
      upcomingPayment.daysUntil <= 3
        ? "warning"
        : "info",
      "YAKLAŞIYOR",
      title,
      `${text} için ${money(
        amount,
        currency
      )} tutarında ödeme planlanmış.`,
      "Sabit Ödemeler",
      "subscriptions"
    );
  }

  const activeGoal = goals.find(
    (goal) =>
      Number(goal?.target) > 0 &&
      Number(goal?.saved) <
        Number(goal?.target)
  );

  if (
    activeGoal &&
    alerts.length < 3
  ) {
    const target =
      Number(activeGoal.target) || 0;
    const saved =
      Number(activeGoal.saved) || 0;

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

    if (progress >= 75) {
      addAlert(
        "success",
        "HEDEF",
        "Hedefin iyi ilerliyor",
        `${activeGoal.title} hedefinde %${Math.round(
          progress
        )} seviyesine ulaştın.`,
        "Hedefleri Aç",
        "goals"
      );
    }
  }

  if (
    alerts.length === 0 &&
    income > 0 &&
    expense > 0 &&
    savings >= 20
  ) {
    addAlert(
      "success",
      "OLUMLU",
      "Finansal görünüm dengeli",
      `Gelirinin yaklaşık %${Math.round(
        savings
      )}'ini koruyabiliyorsun. Bu düzeni sürdürmeye odaklanabilirsin.`,
      "Dashboard",
      "dashboard"
    );
  }

  const visibleAlerts = alerts.slice(
    0,
    3
  );

  return (
    <section className="panel daily-alerts-panel">
      <div className="panel-header">
        <div>
          <span className="daily-alerts-eyebrow">
            AKILLI UYARILAR
          </span>

          <h2>Bugün dikkat etmen gerekenler</h2>

          <p>
            ParaAsistan finansal verilerindeki
            önemli hareketleri senin için öne çıkarır.
          </p>
        </div>

        {visibleAlerts.length > 0 && (
          <span className="daily-alerts-count">
            {visibleAlerts.length} uyarı
          </span>
        )}
      </div>

      {visibleAlerts.length > 0 ? (
        <div className="daily-alerts-grid">
          {visibleAlerts.map(
            (alert, index) => (
              <article
                key={`${alert.title}-${index}`}
                className={`daily-alert-card daily-alert-${alert.type}`}
              >
                <div className="daily-alert-top">
                  <span className="daily-alert-label">
                    {alert.label}
                  </span>
                </div>

                <strong>
                  {alert.title}
                </strong>

                <p>{alert.text}</p>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    onNavigate(
                      alert.actionPage
                    )
                  }
                >
                  {alert.actionLabel}
                </button>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="daily-alert-empty">
          <strong>
            Bugün için kritik bir uyarı yok.
          </strong>

          <p>
            Finansal görünümünü düzenli takip etmeye
            devam edebilirsin.
          </p>
        </div>
      )}
    </section>
  );
}
