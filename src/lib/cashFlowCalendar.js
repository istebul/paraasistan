const getIstanbulDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return null;
  }

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
};

const toDateKey = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

const addDays = (dateKey, days) => {
  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return toDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
};

const getNextSubscriptionDate = (
  subscription,
  startDateKey
) => {
  const paymentDay = Number(
    subscription?.day
  );

  if (
    !Number.isInteger(paymentDay) ||
    paymentDay < 1 ||
    paymentDay > 31
  ) {
    return null;
  }

  const [
    startYear,
    startMonth,
  ] = startDateKey.split("-").map(Number);

  const makeCandidate = (
    year,
    monthNumber
  ) => {
    const daysInMonth = new Date(
      Date.UTC(
        year,
        monthNumber,
        0
      )
    ).getUTCDate();

    return toDateKey(
      year,
      monthNumber,
      Math.min(
        paymentDay,
        daysInMonth
      )
    );
  };

  const currentCandidate = makeCandidate(
    startYear,
    startMonth
  );

  if (currentCandidate >= startDateKey) {
    return currentCandidate;
  }

  if (startMonth === 12) {
    return makeCandidate(
      startYear + 1,
      1
    );
  }

  return makeCandidate(
    startYear,
    startMonth + 1
  );
};

export const buildCashFlowCalendar = ({
  transactions = [],
  subscriptions = [],
  now = new Date(),
  horizonDays = 30,
}) => {
  const nowParts = getIstanbulDateParts(now);

  if (!nowParts) {
    return [];
  }

  const startDate = toDateKey(
    nowParts.year,
    nowParts.month,
    nowParts.day
  );

  const endDate = addDays(
    startDate,
    Math.max(
      0,
      Number(horizonDays) || 30
    )
  );

  const events = [];

  for (const transaction of transactions) {
    if (
      transaction?.type !== "income" &&
      transaction?.type !== "expense"
    ) {
      continue;
    }

    const dateKey = String(
      transaction?.date || ""
    ).slice(0, 10);

    const amount = Number(
      transaction?.amount
    );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateKey
      ) ||
      !Number.isFinite(amount)
    ) {
      continue;
    }

    if (
      dateKey < startDate ||
      dateKey > endDate
    ) {
      continue;
    }

    events.push({
      id:
        transaction.id ||
        `transaction-${dateKey}-${events.length}`,
      date: dateKey,
      title:
        transaction.title ||
        "Finansal işlem",
      type: transaction.type,
      source: "transaction",
      category:
        transaction.category ||
        "Genel",
      amount,
    });
  }

  for (const subscription of subscriptions) {
    if (
      subscription?.type !== "income" &&
      subscription?.type !== "expense"
    ) {
      continue;
    }

    const amount = Number(
      subscription?.amount
    );

    if (!Number.isFinite(amount)) {
      continue;
    }

    const dateKey =
      getNextSubscriptionDate(
        subscription,
        startDate
      );

    if (
      !dateKey ||
      dateKey > endDate
    ) {
      continue;
    }

    events.push({
      id:
        subscription.id ||
        `subscription-${dateKey}-${events.length}`,
      date: dateKey,
      title:
        subscription.title ||
        "Sabit ödeme",
      type: subscription.type,
      source: "subscription",
      category:
        subscription.type === "income"
          ? "Gelir"
          : "Sabit ödeme",
      amount,
    });
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(
        b.date
      );
    }

    if (a.type !== b.type) {
      return a.type === "expense"
        ? -1
        : 1;
    }

    return String(a.title).localeCompare(
      String(b.title),
      "tr"
    );
  });
};
