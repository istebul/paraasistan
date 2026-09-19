export default function DashboardSubscriptionsCard({
  items = [],
  total,
  currency,
  money,
  onOpenSubscriptions,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotal = Number(total) || 0;

  const expenseItems = safeItems.filter(
    (item) => item.type !== "income"
  );

  const highestPayment = expenseItems.reduce(
    (highest, item) => {
      const amount = Number(item.amount) || 0;

      return amount > highest.amount
        ? {
            title: item.title,
            amount,
          }
        : highest;
    },
    {
      title: "",
      amount: 0,
    }
  );

  const getDaysUntilPayment = (day) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const safeDay = Math.max(
      1,
      Math.min(Number(day) || 1, 31)
    );

    let paymentDate = new Date(
      currentYear,
      currentMonth,
      safeDay
    );

    if (
      paymentDate.getMonth() !== currentMonth ||
      paymentDate.getDate() !== safeDay
    ) {
      paymentDate = new Date(
        currentYear,
        currentMonth + 1,
        0
      );
    }

    if (paymentDate < today) {
      paymentDate = new Date(
        currentYear,
        currentMonth + 1,
        safeDay
      );

      if (
        paymentDate.getMonth() !==
        (currentMonth + 1) % 12
      ) {
        paymentDate = new Date(
          currentYear,
          currentMonth + 2,
          0
        );
      }
    }

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfPayment = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate()
    );

    return Math.max(
      0,
      Math.round(
        (startOfPayment - startOfToday) /
          (1000 * 60 * 60 * 24)
      )
    );
  };

  const upcomingPayment = expenseItems
    .map((item) => ({
      ...item,
      daysUntil: getDaysUntilPayment(item.day),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  const upcomingText = upcomingPayment
    ? upcomingPayment.daysUntil === 0
      ? "Bugün"
      : `${upcomingPayment.daysUntil} gün sonra`
    : "Yaklaşan ödeme yok";

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Sabit Ödemeler</h2>
          <p>Aylık abonelik yükü</p>
        </div>

        <strong style={{ fontSize: "22px" }}>
          {money(safeTotal, currency)}
        </strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
          }}
        >
          <small style={{ opacity: 0.65 }}>
            Aktif abonelik
          </small>

          <strong
            style={{
              display: "block",
              marginTop: "4px",
              fontSize: "18px",
            }}
          >
            {expenseItems.length}
          </strong>
        </div>

        <div
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--line)",
          }}
        >
          <small style={{ opacity: 0.65 }}>
            En yüksek ödeme
          </small>

          <strong
            style={{
              display: "block",
              marginTop: "4px",
              fontSize: "18px",
            }}
          >
            {money(
              highestPayment.amount,
              currency
            )}
          </strong>

          {highestPayment.title && (
            <small
              style={{
                display: "block",
                marginTop: "3px",
                opacity: 0.65,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {highestPayment.title}
            </small>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "10px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid var(--line)",
          background: "rgba(99,102,241,.06)",
        }}
      >
        <small style={{ opacity: 0.65 }}>
          Yaklaşan ödeme
        </small>

        <strong
          style={{
            display: "block",
            marginTop: "4px",
            fontSize: "18px",
          }}
        >
          {upcomingPayment
            ? upcomingPayment.title
            : "Yaklaşan ödeme yok"}
        </strong>

        {upcomingPayment && (
          <p
            style={{
              margin: "5px 0 0",
              opacity: 0.7,
              lineHeight: 1.5,
            }}
          >
            Her ayın {upcomingPayment.day}. günü
            {" · "}
            {upcomingText}
          </p>
        )}
      </div>

      <button
        className="secondary-button"
        type="button"
        onClick={onOpenSubscriptions}
        style={{ marginTop: "14px" }}
      >
        Abonelikleri Yönet
      </button>
    </div>
  );
}