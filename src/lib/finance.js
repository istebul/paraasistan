export const calculateTotals = (items) => {
  const income = items
    .filter((item) => item.type === "income")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const expense = items
    .filter((item) => item.type === "expense")
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  return {
    income,
    expense,
    balance: income - expense,
  };
};
