const toFiniteAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const percentChange = (current, previous) => {
  if (previous === 0) return null;

  return ((current - previous) /
    Math.abs(previous)) *
    100;
};

export function buildAdvancedReport({
  monthlyTrend = [],
  categoryTotals = [],
} = {}) {
  const validMonths = monthlyTrend.filter(
    (item) =>
      toFiniteAmount(item.income) > 0 ||
      toFiniteAmount(item.expense) > 0 ||
      toFiniteAmount(item.balance) !== 0
  );

  const monthCount = validMonths.length;

  const totalIncome = validMonths.reduce(
    (sum, item) =>
      sum + toFiniteAmount(item.income),
    0
  );

  const totalExpense = validMonths.reduce(
    (sum, item) =>
      sum + toFiniteAmount(item.expense),
    0
  );

  const totalBalance = validMonths.reduce(
    (sum, item) =>
      sum + toFiniteAmount(item.balance),
    0
  );

  const averageMonthlyIncome =
    monthCount > 0
      ? totalIncome / monthCount
      : 0;

  const averageMonthlyExpense =
    monthCount > 0
      ? totalExpense / monthCount
      : 0;

  const averageMonthlyBalance =
    monthCount > 0
      ? totalBalance / monthCount
      : 0;

  const positiveMonths = validMonths.filter(
    (item) =>
      toFiniteAmount(item.balance) >= 0
  ).length;

  const firstMonth = validMonths[0] || null;
  const latestMonth =
    validMonths[validMonths.length - 1] ||
    null;

  const incomeChange =
    firstMonth && latestMonth
      ? percentChange(
          toFiniteAmount(latestMonth.income),
          toFiniteAmount(firstMonth.income)
        )
      : null;

  const expenseChange =
    firstMonth && latestMonth
      ? percentChange(
          toFiniteAmount(latestMonth.expense),
          toFiniteAmount(firstMonth.expense)
        )
      : null;

  const balanceChange =
    firstMonth && latestMonth
      ? percentChange(
          toFiniteAmount(latestMonth.balance),
          toFiniteAmount(firstMonth.balance)
        )
      : null;

  const topCategories =
    categoryTotals
      .map(([category, amount]) => ({
        category,
        amount: toFiniteAmount(amount),
      }))
      .filter((item) => item.amount > 0)
      .slice(0, 3);

  const currentCategoryTotal =
    topCategories.reduce(
      (sum, item) => sum + item.amount,
      0
    );

  const categoryBase =
    categoryTotals.reduce(
      (sum, [, amount]) =>
        sum + toFiniteAmount(amount),
      0
    );

  const topThreeShare =
    categoryBase > 0
      ? (currentCategoryTotal /
          categoryBase) *
        100
      : 0;

  return {
    monthCount,
    totalIncome,
    totalExpense,
    totalBalance,
    averageMonthlyIncome,
    averageMonthlyExpense,
    averageMonthlyBalance,
    positiveMonths,
    incomeChange,
    expenseChange,
    balanceChange,
    topCategories,
    topThreeShare,
    firstMonth,
    latestMonth,
  };
}
