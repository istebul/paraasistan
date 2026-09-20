export default function DashboardCoach({
  isPremium,
  coachAnswer,
  coachLoading,
  coachError,
  onAsk,
  onNavigate,
}) {
  const questions = [
    {
      label: "Bugünün finansal özeti",
      question:
        "Bugün finansal durumum açısından en önemli konu nedir? Kısa ve uygulanabilir bir öneri ver.",
    },
    {
      label: "Bugün nasıl tasarruf ederim?",
      question:
        "Bu ayki harcamalarımı analiz et. Bugün nereden tasarruf edebileceğimi söyle ve tek bir öncelikli aksiyon öner.",
    },
    {
      label: "Hedefime bugün ne katkı sağlar?",
      question:
        "Finansal hedeflerimi dikkate alarak bugün atabileceğim en faydalı finansal adımı öner.",
    },
  ];

  const handleQuestion = (question) => {
    if (!isPremium) {
      onNavigate("coach");
      return;
    }

    onAsk(question);
  };

  return (
    <section className="panel dashboard-coach-panel">
      <div className="dashboard-coach-header">
        <div>
          <span className="dashboard-coach-eyebrow">
            AI FİNANS KOÇU
          </span>

          <h2>
            Bugün finansal olarak ne yapmalısın?
          </h2>

          <p>
            ParaAsistan verilerini kullanarak günlük
            finansal kararlarına kısa ve uygulanabilir
            öneriler al.
          </p>
        </div>

        <span className="dashboard-coach-badge">
          {isPremium ? "PRO" : "PRO ÖZELLİK"}
        </span>
      </div>

      <div className="dashboard-coach-actions">
        {questions.map((item) => (
          <button
            type="button"
            className="secondary-button"
            key={item.label}
            onClick={() =>
              handleQuestion(item.question)
            }
            disabled={coachLoading}
          >
            {item.label}
          </button>
        ))}
      </div>

      {coachError && (
        <div className="dashboard-coach-error error-box">
          {coachError}
        </div>
      )}

      {coachLoading && (
        <div className="dashboard-coach-loading">
          <div className="spinner" />
          <span>
            Finansal verilerin analiz ediliyor...
          </span>
        </div>
      )}

      {coachAnswer &&
        !coachLoading &&
        !coachError && (
          <div className="dashboard-coach-answer">
            <div className="dashboard-coach-answer-title">
              <span>✦</span>
              ParaAsistan AI
            </div>

            <div className="dashboard-coach-answer-text">
              {coachAnswer
                .split("\n")
                .map((line, index) => (
                  <p key={index}>
                    {line || "\u00A0"}
                  </p>
                ))}
            </div>

            <button
              type="button"
              className="secondary-button dashboard-coach-full-button"
              onClick={() => onNavigate("coach")}
            >
              Finance Coach'u Aç
            </button>
          </div>
        )}
    </section>
  );
}
