const toFiniteAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? amount
    : 0;
};

const categoryTotals = (transactions = []) => {
  const totals = {};

  transactions
    .filter((item) => item?.type === "expense")
    .forEach((item) => {
      const amount = toFiniteAmount(item.amount);

      if (!amount) return;

      const category =
        typeof item.category === "string" &&
        item.category.trim()
          ? item.category.trim()
          : "Genel";

      totals[category] =
        (totals[category] || 0) + amount;
    });

  return totals;
};

export function analyzeSpendingBehavior({
  currentTransactions = [],
  previousTransactions = [],
} = {}) {
  const current = categoryTotals(
    currentTransactions
  );
  const previous = categoryTotals(
    previousTransactions
  );

  const currentTotal = Object.values(current).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const previousTotal = Object.values(previous).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const categories = Array.from(
    new Set([
      ...Object.keys(current),
      ...Object.keys(previous),
    ])
  );

  const analysis = categories
    .map((category) => {
      const currentAmount = current[category] || 0;
      const previousAmount = previous[category] || 0;

      const share =
        currentTotal > 0
          ? (currentAmount / currentTotal) * 100
          : 0;

      const changePercent =
        previousAmount > 0
          ? ((currentAmount - previousAmount) /
              previousAmount) *
            100
          : null;

      let changeType = "unchanged";

      if (
        currentAmount > 0 &&
        previousAmount === 0
      ) {
        changeType = "new";
      } else if (changePercent > 0.000001) {
        changeType = "increase";
      } else if (changePercent < -0.000001) {
        changeType = "decrease";
      }

      return {
        category,
        currentAmount,
        previousAmount,
        share,
        changePercent,
        changeType,
      };
    })
    .sort(
      (a, b) =>
        b.currentAmount - a.currentAmount
    );

  const topCategory =
    analysis.find(
      (item) => item.currentAmount > 0
    ) || null;

  const changedCategories = analysis.filter(
    (item) =>
      item.changeType === "increase" ||
      item.changeType === "decrease" ||
      item.changeType === "new"
  );

  const largestIncrease =
    analysis
      .filter(
        (item) =>
          item.changeType === "increase"
      )
      .sort(
        (a, b) =>
          (b.changePercent || 0) -
          (a.changePercent || 0)
      )[0] || null;

  const largestDecrease =
    analysis
      .filter(
        (item) =>
          item.changeType === "decrease"
      )
      .sort(
        (a, b) =>
          (a.changePercent || 0) -
          (b.changePercent || 0)
      )[0] || null;

  const newCategory =
    analysis.find(
      (item) => item.changeType === "new"
    ) || null;

  return {
    currentTotal,
    previousTotal,
    analysis,
    topCategory,
    changedCategories,
    changedCategoryCount:
      changedCategories.length,
    largestIncrease,
    largestDecrease,
    newCategory,
  };
}
