import {
  buildAdvancedReport,
} from "../lib/advancedReports.js";

export default function AdvancedReports({
  monthlyTrend,
  categoryTotals,
  currency,
  money,
}) {
  const report = buildAdvancedReport({
    monthlyTrend,
    categoryTotals,
  });

  const changeText = (value) => {
    if (value === null) return "Karşılaştırılamıyor";

    return `${value >= 0 ? "+" : ""}%${Math.round(
      value
    )}`;
  };

  if (report.monthCount === 0) {
    return (
      <section className="panel advanced-reports-card">
        <div className="panel-header">
          <div>
            <h2>Gelişmiş Raporlama</h2>
            <p>
              Uzun dönem finansal görünümünü incele.
            </p>
          </div>
          <span className="advanced-reports-badge">
            PREMIUM
          </span>
        </div>

        <div className="empty-state">
          Gelişmiş raporlama için yeterli finansal veri
          oluştuğunda analiz burada görünecek.
        </div>
      </section>
    );
  }

  return (
    <section className="panel advanced-reports-card">
      <div className="panel-header">
        <div>
          <h2>Gelişmiş Raporlama</h2>
          <p>
            Son {report.monthCount} aylık finansal
            verilerinden özet analiz.
          </p>
        </div>

        <span className="advanced-reports-badge">
          PREMIUM
        </span>
      </div>

      <div className="advanced-reports-summary">
        <div>
          <span>Ort. aylık gelir</span>
          <strong>
            {money(
              report.averageMonthlyIncome,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Ort. aylık gider</span>
          <strong>
            {money(
              report.averageMonthlyExpense,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Ort. aylık net</span>
          <strong
            className={
              report.averageMonthlyBalance >= 0
                ? "positive"
                : "negative"
            }
          >
            {money(
              report.averageMonthlyBalance,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>Pozitif ay</span>
          <strong>
            {report.positiveMonths}/
            {report.monthCount}
          </strong>
        </div>
      </div>

      <div className="advanced-reports-changes">
        <div>
          <span>Gelir dönem değişimi</span>
          <strong>
            {changeText(report.incomeChange)}
          </strong>
        </div>

        <div>
          <span>Gider dönem değişimi</span>
          <strong>
            {changeText(report.expenseChange)}
          </strong>
        </div>

        <div>
          <span>Net dönem değişimi</span>
          <strong>
            {changeText(report.balanceChange)}
          </strong>
        </div>

        <div>
          <span>İlk → son ay</span>
          <strong>
            {report.firstMonth?.label ||
              report.firstMonth?.month ||
              "—"}
            {" → "}
            {report.latestMonth?.label ||
              report.latestMonth?.month ||
              "—"}
          </strong>
        </div>
      </div>

      {report.topCategories.length > 0 && (
        <div className="advanced-reports-category">
          <div>
            <small>
              Bu ay en yüksek üç kategori
            </small>
            <div className="advanced-reports-category-list">
              {report.topCategories.map(
                (item) => (
                  <div
                    key={item.category}
                    className="advanced-reports-category-row"
                  >
                    <strong>
                      {item.category}
                    </strong>
                    <span>
                      {money(
                        item.amount,
                        currency
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="advanced-reports-share">
            <small>İlk üç kategorinin payı</small>
            <strong>
              %{Math.round(
                report.topThreeShare
              )}
            </strong>
          </div>
        </div>
      )}

      <div className="advanced-reports-note">
        Dönem değişimleri mevcut altı aylık kayıt
        aralığındaki ilk ve son geçerli ay karşılaştırılarak
        hesaplanır. Eksik dönemlerde sonuçlar sınırlı olabilir.
      </div>
    </section>
  );
}
