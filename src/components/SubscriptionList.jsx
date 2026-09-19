export default function SubscriptionList({ items, total, currency, money, onDelete }) {
  const paymentStatus = (day) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const nextMonthDays = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      0
    ).getDate();
    const safeDay = Math.min(Number(day) || 1, daysInMonth);
    const diff = safeDay - currentDay;

    if (diff === 0) return "Bugün";
    if (diff > 0 && diff <= 7) return `${diff} gün kaldı`;

    if (diff < 0) {
      const daysUntilNext = daysInMonth - currentDay + Math.min(Number(day) || 1, nextMonthDays);
      if (daysUntilNext <= 7) return `${daysUntilNext} gün sonra`;
    }

    return "";
  };
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Abonelikler</h2>
          <p>Aylık toplam: {money(total, currency)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Henüz abonelik yok.</div>
      ) : (
        <div className="subscription-list">
          {items.map((item) => (
            <div className="subscription-card" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.type === "income" ? "Gelir" : "Gider"} · Her ayın {item.day}. günü
                  {paymentStatus(item.day) && ` · ${paymentStatus(item.day)}`}
                </span>
              </div>
              <div className="subscription-right">
                <strong className={item.type === "income" ? "positive" : "negative"}>
                  {item.type === "income" ? "+" : "-"}{money(item.amount, currency)}
                </strong>
                <button className="delete-button" type="button" onClick={() => onDelete(item.id)}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


