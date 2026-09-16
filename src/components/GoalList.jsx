export default function GoalList({ goals, contributions, currency, money, dateText, daysUntil, onDelete, onContribute }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Hedeflerim</h2>
          <p>Finansal hedeflerini takip et</p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">Henüz hedef eklenmemiş.</div>
      ) : (
        <div className="goal-list">
          {goals.map((goal) => {
            const target = Number(goal.target) || 0;
            const saved = Number(goal.saved) || 0;
            const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
            const remaining = Math.max(target - saved, 0);
            const days = daysUntil(goal.deadline);
            const deadlineText = goal.deadline
              ? days !== null
                ? days < 0 ? "Süre geçti" : `${days} gün kaldı`
                : dateText(goal.deadline)
              : "Son tarih yok";
            const goalContributions = contributions
              .filter((item) => item.goal_id === goal.id)
              .slice(0, 5);

            return (
              <div className="goal-card" key={goal.id}>
                <div className="goal-top">
                  <div>
                    <strong>{goal.title}</strong>
                    <span>{money(saved, currency)} / {money(target, currency)}</span>
                  </div>
                  <div className="goal-actions">
                    <button className="secondary-button" type="button" onClick={() => onContribute(goal)}>Para ekle</button>
                    <button className="delete-button" type="button" onClick={() => onDelete(goal.id)}>Sil</button>
                  </div>
                </div>
                <div className="progress large">
                  <div style={{ width: `${progress}%` }} />
                </div>
                <div className="goal-bottom">
                  <span>%{Math.round(progress)} tamamlandı</span>
                  <span>Kalan: {money(remaining, currency)}</span>
                  <span>{deadlineText}</span>
                </div>

                {goalContributions.length > 0 && (
                  <details className="goal-contribution-history">
                    <summary>Katkı geçmişi ({goalContributions.length})</summary>
                    <div className="contribution-list">
                      {goalContributions.map((item) => (
                        <div className="contribution-row" key={item.id}>
                          <span>{item.note || "Katkı"}</span>
                          <strong>{money(item.amount, currency)}</strong>
                          <small>{dateText(item.created_at?.slice(0, 10))}</small>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
