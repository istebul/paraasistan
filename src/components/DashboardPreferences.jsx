import { useState } from "react";

const OPTIONS = [
  {
    key: "dailyControl",
    label: "Günlük Kontrol Merkezi",
    description: "Günün finans özetini gösterir.",
  },
  {
    key: "alerts",
    label: "Akıllı Uyarılar",
    description: "Önemli finansal hareketleri öne çıkarır.",
  },
  {
    key: "quickTransaction",
    label: "Hızlı İşlem",
    description: "Dashboard'dan gelir veya gider eklemeyi sağlar.",
  },
  {
    key: "coach",
    label: "AI Finans Koçu",
    description: "Dashboard'dan günlük finansal öneri almayı sağlar.",
  },
  {
    key: "health",
    label: "Finansal Sağlık",
    description: "Finansal sağlık skorunu gösterir.",
  },
  {
    key: "budget",
    label: "Bütçe Durumu",
    description: "Aylık bütçe kullanımını gösterir.",
  },
  {
    key: "spending",
    label: "Harcama Analizi",
    description: "Kategori bazlı harcamaları gösterir.",
  },
  {
    key: "insights",
    label: "Akıllı İçgörüler",
    description: "Verilerinden çıkarılan önemli noktaları gösterir.",
  },
  {
    key: "goals",
    label: "Hedef Özeti",
    description: "Birikim hedeflerinin ilerlemesini gösterir.",
  },
  {
    key: "subscriptions",
    label: "Sabit Ödemeler",
    description: "Abonelik ve düzenli ödemeleri gösterir.",
  },
  {
    key: "recent",
    label: "Son İşlemler",
    description: "En son finansal hareketlerini gösterir.",
  },
];

export default function DashboardPreferences({
  preferences,
  onChange,
  onReset,
}) {
  const [open, setOpen] = useState(false);

  const enabledCount = OPTIONS.filter(
    (option) => preferences[option.key]
  ).length;

  const toggle = (key) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <section className="dashboard-preferences">
      <button
        type="button"
        className="secondary-button dashboard-preferences-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        ⚙ Dashboard Düzeni
        <span>
          {enabledCount}/{OPTIONS.length}
        </span>
      </button>

      {open && (
        <div className="dashboard-preferences-panel">
          <div className="dashboard-preferences-header">
            <div>
              <strong>Dashboard Düzeni</strong>
              <p>
                Görmek istediğin bölümleri seç.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button dashboard-preferences-reset"
              onClick={onReset}
            >
              Varsayılana dön
            </button>
          </div>

          <div className="dashboard-preferences-grid">
            {OPTIONS.map((option) => (
              <label
                key={option.key}
                className={`dashboard-preference-option ${
                  preferences[option.key]
                    ? "is-enabled"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(
                    preferences[option.key]
                  )}
                  onChange={() =>
                    toggle(option.key)
                  }
                />

                <span className="dashboard-preference-check">
                  {preferences[option.key]
                    ? "✓"
                    : ""}
                </span>

                <span className="dashboard-preference-copy">
                  <strong>{option.label}</strong>
                  <small>
                    {option.description}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
