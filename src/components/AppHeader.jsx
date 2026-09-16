import MonthPicker from "./MonthPicker";

const pageTitles = {
  dashboard: "Genel Bakış",
  transactions: "İşlemler",
  goals: "Finansal Hedefler",
  subscriptions: "Abonelikler",
  budget: "Bütçe Yönetimi",
  reports: "Finansal Raporlar",
  coach: "AI Finans Koçu",
  profile: "Profilim",
  premium: "ParaAsistan Premium",
};

export default function AppHeader({
  page,
  userName,
  selectedMonth,
  loadingData,
  onMonthChange,
}) {
  const showMonthPicker = [
    "dashboard",
    "reports",
    "budget",
  ].includes(page);

  const description =
    page === "dashboard"
      ? `Hoş geldin, ${userName}.`
      : page === "profile"
      ? "Hesap ve kişisel bilgilerini yönet."
      : page === "premium"
      ? "Finansal deneyimini bir üst seviyeye taşı."
      : "Finansal durumunu kolayca yönet.";

  return (
    <header className="topbar">
      <div>
        <h1>{pageTitles[page]}</h1>
        <p>{description}</p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {showMonthPicker && (
          <MonthPicker
            value={selectedMonth}
            label={new Date(
              `${selectedMonth}-01T00:00:00`
            ).toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })}
            onChange={onMonthChange}
          />
        )}

        {loadingData && (
          <div className="sync-status">Veriler yenileniyor...</div>
        )}
      </div>
    </header>
  );
}
