const toFiniteAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const calculateTotals = (items) => {
  const income = items
    .filter((item) => item.type === "income")
    .reduce(
      (sum, item) => sum + toFiniteAmount(item.amount),
      0
    );

  const expense = items
    .filter((item) => item.type === "expense")
    .reduce(
      (sum, item) => sum + toFiniteAmount(item.amount),
      0
    );

  return {
    income,
    expense,
    balance: income - expense,
  };
};
