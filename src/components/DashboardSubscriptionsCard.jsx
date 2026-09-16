export default function DashboardSubscriptionsCard({
  total,
  currency,
  money,
  onOpenSubscriptions,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Sabit Ödemeler</h2>
          <p>Aylık abonelik yükü</p>
        </div>
        <strong>{money(total, currency)}</strong>
      </div>

      <div style={{ marginTop: "18px" }}>
        <p>
          Aylık aboneliklerin toplamı <strong>{money(total, currency)}</strong>.
        </p>
        <button className="secondary-button" onClick={onOpenSubscriptions}>
          Abonelikleri Yönet
        </button>
      </div>
    </div>
  );
}
