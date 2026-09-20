const toFiniteAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? amount
    : 0;
};

const toSafeDay = (value) => {
  const day = Number(value);

  if (
    !Number.isFinite(day) ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return Math.trunc(day);
};

const daysInMonth = (year, monthIndex) =>
  new Date(
    year,
    monthIndex + 1,
    0
  ).getDate();

const dateKey = (year, monthIndex, day) => {
  const safeDay = Math.min(
    day,
    daysInMonth(year, monthIndex)
  );

  return `${year}-${String(
    monthIndex + 1
  ).padStart(2, "0")}-${String(safeDay).padStart(
    2,
    "0"
  )}`;
};

const diffDays = (fromDate, toDate) =>
  Math.round(
    (toDate.getTime() - fromDate.getTime()) /
      (24 * 60 * 60 * 1000)
  );

export function analyzeSubscriptionIntelligence({
  subscriptions = [],
  today = new Date(),
} = {}) {
  const validSubscriptions = subscriptions
    .map((item) => ({
      ...item,
      amount: toFiniteAmount(item.amount),
      day: toSafeDay(item.day),
      type:
        item.type === "income"
          ? "income"
          : "expense",
    }))
    .filter(
      (item) =>
        item.amount > 0 &&
        item.day !== null
    );

  const expenseItems = validSubscriptions.filter(
    (item) => item.type === "expense"
  );

  const incomeItems = validSubscriptions.filter(
    (item) => item.type === "income"
  );

  const monthlyExpense = expenseItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const monthlyIncome = incomeItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const monthlyNet =
    monthlyIncome - monthlyExpense;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const upcoming = validSubscriptions
    .map((item) => {
      let paymentYear = currentYear;
      let paymentMonth = currentMonth;
      let paymentDate = new Date(
        currentYear,
        currentMonth,
        Math.min(
          item.day,
          daysInMonth(
            currentYear,
            currentMonth
          )
        )
      );

      if (paymentDate < today) {
        paymentMonth += 1;

        if (paymentMonth > 11) {
          paymentMonth = 0;
          paymentYear += 1;
        }

        paymentDate = new Date(
          paymentYear,
          paymentMonth,
          Math.min(
            item.day,
            daysInMonth(
              paymentYear,
              paymentMonth
            )
          )
        );
      }

      return {
        ...item,
        paymentDate: dateKey(
          paymentYear,
          paymentMonth,
          item.day
        ),
        daysUntil: diffDays(
          today,
          paymentDate
        ),
      };
    })
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil
    );

  const nextPayment =
    upcoming[0] || null;

  const upcomingSevenDays =
    upcoming.filter(
      (item) =>
        item.daysUntil >= 0 &&
        item.daysUntil <= 7
    );

  const largestExpense = [...expenseItems].sort(
    (a, b) => b.amount - a.amount
  )[0] || null;

  const incomeCoverage =
    monthlyIncome > 0
      ? (monthlyExpense / monthlyIncome) *
        100
      : null;

  return {
    totalCount: validSubscriptions.length,
    expenseCount: expenseItems.length,
    incomeCount: incomeItems.length,
    monthlyExpense,
    monthlyIncome,
    monthlyNet,
    incomeCoverage,
    upcoming,
    upcomingSevenDays,
    upcomingSevenDaysCount:
      upcomingSevenDays.length,
    nextPayment,
    largestExpense,
  };
}
