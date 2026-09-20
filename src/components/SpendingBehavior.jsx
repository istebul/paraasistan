import {
  analyzeSpendingBehavior,
} from "../lib/spendingBehavior.js";

export default function SpendingBehavior({
  currentTransactions,
  previousTransactions,
  month,
  currency,
  money,
}) {
  const result = analyzeSpendingBehavior({
    currentTransactions,
    previousTransactions,
  });

  const visibleCategories =
    result.analysis
      .filter(
        (item) => item.currentAmount > 0
      )
      .slice(0, 5);

  const changeText = (item) => {
    if (item.changeType === "new") {
      return "Yeni kategori";
    }

    if (item.changeType === "increase") {
      return `%${Math.round(
        Math.abs(item.changePercent)
      )} artış`;
    }

    if (item.changeType === "decrease") {
      return `%${Math.round(
        Math.abs(item.changePercent)
      )} azalış`;
    }

    return "Değişim yok";
  };

  if (
    result.currentTotal === 0 &&
    result.previousTotal === 0
  ) {
    return (
      <section className="panel spending-behavior-card">
        <div className="panel-header">
          <div>
            <h2>Harcama Davranışı</h2>
            <p>
              Aylık harcama alışkanlıklarını karşılaştır
            </p>
          </div>
        </div>
        <div className="empty-state">
          Karşılaştırma yapmak için henüz yeterli gider
          verisi yok.
        </div>
      </section>
    );
  }

  return (
    <section className="panel spending-behavior-card">
      <div className="panel-header">
        <div>
          <h2>Harcama Davranışı</h2>
          <p>
            {month} ile geçen ayın kategori değişimini
            karşılaştır.
          </p>
        </div>
      </div>

      <div className="spending-behavior-summary">
        <div>
          <span>Bu ay toplam gider</span>
          <strong>
            {money(
              result.currentTotal,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Geçen ay toplam gider</span>
          <strong>
            {money(
              result.previousTotal,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Değişen kategori</span>
          <strong>
            {result.changedCategoryCount}
          </strong>
        </div>

        <div>
          <span>En büyük pay</span>
          <strong>
            {result.topCategory?.category ||
              "—"}
          </strong>
        </div>
      </div>

      {result.topCategory && (
        <div className="spending-behavior-focus">
          <div>
            <small>En yüksek harcama payı</small>
            <strong>
              {result.topCategory.category}
            </strong>
          </div>

          <div>
            <strong>
              {money(
                result.topCategory.currentAmount,
                currency
              )}
            </strong>
            <small>
              %{Math.round(
                result.topCategory.share
              )} toplam gider
            </small>
          </div>
        </div>
      )}

      {visibleCategories.length > 0 && (
        <div className="spending-behavior-list">
          {visibleCategories.map((item) => (
            <div
              className="spending-behavior-row"
              key={item.category}
            >
              <div>
                <strong>{item.category}</strong>
                <span>
                  {money(
                    item.currentAmount,
                    currency
                  )}{" "}
                  · %{Math.round(item.share)}
                </span>
              </div>

              <small
                className={`spending-behavior-change spending-behavior-${item.changeType}`}
              >
                {changeText(item)}
              </small>
            </div>
          ))}
        </div>
      )}

      <div className="spending-behavior-insight">
        {result.largestIncrease && (
          <p>
            Geçen aya göre en yüksek oransal artış{" "}
            <strong>
              {result.largestIncrease.category}
            </strong>{" "}
            kategorisinde: yaklaşık %{" "}
            {Math.round(
              result.largestIncrease.changePercent
            )}.
          </p>
        )}

        {!result.largestIncrease &&
          result.newCategory && (
            <p>
              Bu ay yeni görünen kategori:{" "}
              <strong>
                {result.newCategory.category}
              </strong>
              .
            </p>
          )}

        {!result.largestIncrease &&
          !result.newCategory &&
          result.largestDecrease && (
            <p>
              Geçen aya göre en belirgin düşüş{" "}
              <strong>
                {result.largestDecrease.category}
              </strong>{" "}
              kategorisinde: yaklaşık %{" "}
              {Math.round(
                Math.abs(
                  result.largestDecrease
                    .changePercent
                )
              )}.
            </p>
          )}

        {!result.largestIncrease &&
          !result.newCategory &&
          !result.largestDecrease && (
            <p>
              Mevcut verilerde belirgin bir kategori
              değişimi görünmüyor.
            </p>
          )}
      </div>

      {result.previousTotal === 0 &&
        result.currentTotal > 0 && (
          <div className="spending-behavior-note">
            Geçen ay gider verisi olmadığı için kategori
            değişimleri sınırlı karşılaştırılabilir.
          </div>
        )}
    </section>
  );
}
