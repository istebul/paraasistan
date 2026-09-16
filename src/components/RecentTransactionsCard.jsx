export default function RecentTransactionsCard({
  transactions,
  currency,
  money,
  dateText,
  onOpenTransactions,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Son İşlemler</h2>
          <p>En son finansal hareketlerin</p>
        </div>
        <button className="secondary-button" onClick={onOpenTransactions}>
          Tümünü Gör
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">Bu ay işlem bulunmuyor.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Açıklama</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td>{dateText(item.date)}</td>
                  <td className={item.type === "income" ? "positive" : "negative"}>
                    {item.type === "income" ? "+" : "-"}
                    {money(item.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
