export default function RecentTransactionsCard({
  transactions,
  currency,
  money,
  dateText,
  onOpenTransactions,
}) {
  const visibleTransactions = transactions.slice(0, 8);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Son İşlemler</h2>
          <p>
            {transactions.length > 0
              ? `Bu ayki son ${Math.min(
                  transactions.length,
                  8
                )} finansal hareket`
              : "En son finansal hareketlerin"}
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={onOpenTransactions}
        >
          Tümünü Gör
        </button>
      </div>

      {visibleTransactions.length === 0 ? (
        <div className="empty-state">
          <strong>Bu ay işlem bulunmuyor.</strong>
          <p
            style={{
              margin: "6px 0 0",
              opacity: 0.7,
            }}
          >
            İlk gelir veya gider kaydını eklediğinde
            burada görünecek.
          </p>
        </div>
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
              {visibleTransactions.map((item) => {
                const isIncome =
                  item.type === "income";

                const amount =
                  Number(item.amount) || 0;

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>

                    <td>{item.category}</td>

                    <td>{dateText(item.date)}</td>

                    <td
                      className={
                        isIncome
                          ? "positive"
                          : "negative"
                      }
                    >
                      {isIncome ? "+" : "-"}
                      {money(
                        amount,
                        currency
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}