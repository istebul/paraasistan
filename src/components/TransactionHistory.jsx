import TransactionFilters from "./TransactionFilters";

export default function TransactionHistory({
  results,
  total,
  categories,
  search,
  type,
  category,
  currency,
  money,
  dateText,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onExport,
  onEdit,
  onDelete,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>İşlem Geçmişi</h2>
          <p>{results.length} sonuç / {total} toplam kayıt</p>
        </div>
        <button className="secondary-button" type="button" onClick={onExport}>
          CSV indir
        </button>
      </div>

      <TransactionFilters
        categories={categories}
        search={search}
        type={type}
        category={category}
        onSearchChange={onSearchChange}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
      />

      {results.length === 0 ? (
        <div className="empty-state">Filtrelere uygun işlem bulunamadı.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Açıklama</th>
                <th>Tür</th>
                <th>Kategori</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.type === "income" ? "Gelir" : "Gider"}</td>
                  <td>{item.category}</td>
                  <td>{dateText(item.date)}</td>
                  <td className={item.type === "income" ? "positive" : "negative"}>
                    {item.type === "income" ? "+" : "-"}
                    {money(item.amount, currency)}
                  </td>
                  <td>
                    <div className="transaction-actions">
                      <button className="secondary-button" type="button" onClick={() => onEdit(item)}>
                        Düzenle
                      </button>
                      <button className="delete-button" type="button" onClick={() => onDelete(item.id)}>
                        Sil
                      </button>
                    </div>
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
