export default function DashboardGoalsCard({
  goals,
  currency,
  money,
  onOpenGoals,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Hedef Özeti</h2>
          <p>Finansal hedeflerin</p>
        </div>
        <button className="secondary-button" onClick={onOpenGoals}>
          Hedefleri Gör
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">Henüz finansal hedef oluşturmadın.</div>
      ) : (
        <div className="goal-list">
          {goals.slice(0, 3).map((goal) => {
            const target = Number(goal.target) || 0;
            const saved = Number(goal.saved) || 0;
            const progress = target > 0
              ? Math.min(100, (saved / target) * 100)
              : 0;

            return (
              <div className="goal-card" key={goal.id}>
                <div className="goal-top">
                  <div>
                    <strong>{goal.title}</strong>
                    <span>
                      {money(saved, currency)} / {money(target, currency)}
                    </span>
                  </div>
                  <strong>%{Math.round(progress)}</strong>
                </div>
                <div className="progress large">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
