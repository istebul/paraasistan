import { useMemo } from "react";
import { buildCashFlowCalendar } from "../lib/cashFlowCalendar";

const formatDate = (dateKey) => {
  const [year, month, day] =
    dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    )
  );
};

const getDaysUntil = (
  dateKey,
  todayKey
) => {
  const [year, month, day] =
    todayKey.split("-").map(Number);

  const [targetYear, targetMonth, targetDay] =
    dateKey.split("-").map(Number);

  return Math.round(
    (
      Date.UTC(
        targetYear,
        targetMonth - 1,
        targetDay
      ) -
      Date.UTC(
        year,
        month - 1,
        day
      )
    ) /
      86400000
  );
};

const getTodayKey = () => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
};

export default function CashFlowCalendar({
  transactions = [],
  subscriptions = [],
  currency,
  money,
}) {
  const events = useMemo(
    () =>
      buildCashFlowCalendar({
        transactions,
        subscriptions,
        horizonDays: 30,
      }),
    [transactions, subscriptions]
  );

  const todayKey = getTodayKey();

  const groupedEvents = events.reduce(
    (groups, event) => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }

      groups[event.date].push(event);
      return groups;
    },
    {}
  );

  const dates = Object.keys(
    groupedEvents
  );

  return (
    <section className="panel cash-flow-calendar-panel">
      <div className="cash-flow-calendar-header">
        <div>
          <span className="cash-flow-calendar-eyebrow">
            NAKİT AKIŞI
          </span>

          <h2>Önümüzdeki 30 gün</h2>

          <p>
            Yaklaşan gelirleri, planlı işlemleri ve
            sabit ödemeleri tek takvimde gör.
          </p>
        </div>

        <span className="cash-flow-calendar-count">
          {events.length} hareket
        </span>
      </div>

      {dates.length > 0 ? (
        <div className="cash-flow-calendar-list">
          {dates.map((dateKey) => (
            <div
              className="cash-flow-calendar-day"
              key={dateKey}
            >
              <div className="cash-flow-calendar-date">
                <strong>
                  {formatDate(dateKey)}
                </strong>

                <span>
                  {(() => {
                    const days =
                      getDaysUntil(
                        dateKey,
                        todayKey
                      );

                    if (days === 0) {
                      return "Bugün";
                    }

                    if (days === 1) {
                      return "Yarın";
                    }

                    return `${days} gün sonra`;
                  })()}
                </span>
              </div>

              <div className="cash-flow-calendar-events">
                {groupedEvents[
                  dateKey
                ].map((event) => (
                  <div
                    className={`cash-flow-event cash-flow-${event.type}`}
                    key={event.id}
                  >
                    <div className="cash-flow-event-main">
                      <span className="cash-flow-event-source">
                        {event.source ===
                        "subscription"
                          ? "Sabit ödeme"
                          : "Planlı işlem"}
                      </span>

                      <strong>
                        {event.title}
                      </strong>

                      <small>
                        {event.category}
                      </small>
                    </div>

                    <strong className="cash-flow-event-amount">
                      {event.type ===
                      "income"
                        ? "+"
                        : "-"}
                      {money(
                        event.amount,
                        currency
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cash-flow-calendar-empty">
          <strong>
            Önümüzdeki 30 gün için planlı hareket yok.
          </strong>

          <p>
            Yeni bir tarihli işlem veya sabit ödeme
            eklediğinde burada görünecek.
          </p>
        </div>
      )}

      <div className="cash-flow-calendar-legend">
        <span>
          <i className="cash-flow-dot income" />
          Gelir
        </span>

        <span>
          <i className="cash-flow-dot expense" />
          Gider
        </span>

        <span>
          <i className="cash-flow-dot subscription" />
          Sabit ödeme
        </span>
      </div>
    </section>
  );
}
