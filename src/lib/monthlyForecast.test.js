import test from "node:test";
import assert from "node:assert/strict";
import { calculateMonthlyForecast } from "./monthlyForecast.js";

test("monthly forecast projects current month using current daily pace", () => {
  const result = calculateMonthlyForecast({
    selectedMonth: "2026-09",
    now: new Date("2026-09-10T10:00:00+03:00"),
    transactions: [
      {
        type: "income",
        amount: 3000,
        date: "2026-09-01",
      },
      {
        type: "expense",
        amount: 1000,
        date: "2026-09-05",
      },
    ],
  });

  assert.equal(result.mode, "current");
  assert.equal(result.actualIncome, 3000);
  assert.equal(result.actualExpense, 1000);
  assert.equal(
    result.projectedIncome,
    9000
  );
  assert.equal(
    result.projectedExpense,
    3000
  );
  assert.equal(
    result.projectedBalance,
    6000
  );
});

test("monthly forecast returns actual values for historical months", () => {
  const result = calculateMonthlyForecast({
    selectedMonth: "2026-08",
    now: new Date("2026-09-10T10:00:00+03:00"),
    transactions: [
      {
        type: "income",
        amount: 10000,
        date: "2026-08-03",
      },
      {
        type: "expense",
        amount: 7000,
        date: "2026-08-18",
      },
    ],
  });

  assert.equal(result.mode, "historical");
  assert.equal(
    result.projectedIncome,
    10000
  );
  assert.equal(
    result.projectedExpense,
    7000
  );
  assert.equal(
    result.projectedBalance,
    3000
  );
});

test("monthly forecast ignores invalid amounts and unrelated transaction types", () => {
  const result = calculateMonthlyForecast({
    selectedMonth: "2026-09",
    now: new Date("2026-09-10T10:00:00+03:00"),
    transactions: [
      {
        type: "income",
        amount: 3000,
        date: "2026-09-01",
      },
      {
        type: "expense",
        amount: "not-a-number",
        date: "2026-09-02",
      },
      {
        type: "transfer",
        amount: 9000,
        date: "2026-09-03",
      },
    ],
  });

  assert.equal(
    result.actualIncome,
    3000
  );
  assert.equal(
    result.actualExpense,
    0
  );
  assert.equal(
    result.transactionCount,
    1
  );
});
