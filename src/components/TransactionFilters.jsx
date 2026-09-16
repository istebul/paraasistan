export default function TransactionFilters({
  categories,
  search,
  type,
  category,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
}) {
  return (
    <div className="transaction-filters">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="İşlem veya kategori ara..."
        aria-label="İşlem veya kategori ara"
      />

      <select
        value={type}
        onChange={(event) => onTypeChange(event.target.value)}
        aria-label="İşlem türü filtresi"
      >
        <option value="all">Tüm türler</option>
        <option value="income">Gelirler</option>
        <option value="expense">Giderler</option>
      </select>

      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        aria-label="İşlem kategorisi filtresi"
      >
        <option value="all">Tüm kategoriler</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
