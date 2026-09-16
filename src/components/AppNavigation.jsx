const navigationItems = [
  ["dashboard", "⌂", "Genel Bakış"],
  ["transactions", "↕", "İşlemler"],
  ["goals", "◎", "Hedefler"],
  ["subscriptions", "↻", "Abonelikler"],
  ["budget", "▣", "Bütçe"],
  ["reports", "▥", "Raporlar"],
  ["coach", "✦", "AI Finans Koçu"],
  ["profile", "◉", "Profilim"],
  ["premium", "★", "Premium'a Geç"],
];

export default function AppNavigation({
  page,
  isPremium,
  userName,
  email,
  onNavigate,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">₺</div>
        <div>
          <strong>ParaAsistan</strong>
          <span>Akıllı finans yönetimi</span>
        </div>
      </div>

      <nav>
        {navigationItems.map(([key, icon, label]) => (
          <button
            key={key}
            type="button"
            className={`${page === key ? "active " : ""}${
              key === "coach" ? "ai-nav" : ""
            }`}
            aria-current={page === key ? "page" : undefined}
            onClick={() => onNavigate(key)}
          >
            <span>{icon}</span>
            {key === "premium" && isPremium ? "Premium" : label}
            {key === "coach" && isPremium && (
              <small style={{ marginLeft: "auto" }}>PRO</small>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-box">
          <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{userName}</strong>
            <span>{isPremium ? "Premium üye" : email}</span>
          </div>
        </div>

        <button className="logout-button" onClick={onLogout}>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
