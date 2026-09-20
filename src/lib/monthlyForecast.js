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
    monthKey: `${year}-${month}`,
  };
};

const getDaysInMonth = (year, month) => {
  return new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();
};

const isValidMonthKey = (value) => {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}$/.test(value)
  );
};

export const calculateMonthlyForecast = ({
  transactions = [],
  selectedMonth,
  now = new Date(),
}) => {
  const nowParts = getIstanbulDateParts(now);

  if (
    !nowParts ||
    !isValidMonthKey(selectedMonth)
  ) {
    return {
      mode: "unavailable",
      transactionCount: 0,
      actualIncome: 0,
      actualExpense: 0,
      actualBalance: 0,
      projectedIncome: 0,
      projectedExpense: 0,
      projectedBalance: 0,
      elapsedDays: 0,
      daysInMonth: 0,
      budgetUsage: null,
    };
  }

  const selectedTransactions = transactions.filter(
    (transaction) =>
      String(transaction?.date || "").slice(0, 7) ===
        selectedMonth &&
      (transaction?.type === "income" ||
        transaction?.type === "expense") &&
      Number.isFinite(Number(transaction?.amount))
  );

  const actualIncome = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const actualExpense = selectedTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0
    );

  const actualBalance =
    actualIncome - actualExpense;

  const [selectedYear, selectedMonthNumber] =
    selectedMonth.split("-").map(Number);

  const daysInMonth = getDaysInMonth(
    selectedYear,
    selectedMonthNumber
  );

  if (
    selectedMonth !== nowParts.monthKey
  ) {
    return {
      mode: "historical",
      transactionCount:
        selectedTransactions.length,
      actualIncome,
      actualExpense,
      actualBalance,
      projectedIncome: actualIncome,
      projectedExpense: actualExpense,
      projectedBalance: actualBalance,
      elapsedDays: daysInMonth,
      daysInMonth,
      budgetUsage: null,
    };
  }

  const elapsedDays = Math.min(
    Math.max(nowParts.day, 1),
    daysInMonth
  );

  const projectedIncome =
    actualIncome > 0
      ? (actualIncome / elapsedDays) *
        daysInMonth
      : 0;

  const projectedExpense =
    actualExpense > 0
      ? (actualExpense / elapsedDays) *
        daysInMonth
      : 0;

  const projectedBalance =
    projectedIncome - projectedExpense;

  return {
    mode: "current",
    transactionCount:
      selectedTransactions.length,
    actualIncome,
    actualExpense,
    actualBalance,
    projectedIncome,
    projectedExpense,
    projectedBalance,
    elapsedDays,
    daysInMonth,
    budgetUsage: null,
  };
};
