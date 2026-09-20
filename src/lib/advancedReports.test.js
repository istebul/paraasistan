import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdvancedReport,
} from "./advancedReports.js";

const assertClose = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be close to ${expected}`
  );
};

test("advanced reports calculate six-month averages and period changes", () => {
  const result = buildAdvancedReport({
    monthlyTrend: [
      {
        month: "2026-04",
        income: 10000,
        expense: 6000,
        balance: 4000,
      },
      {
        month: "2026-05",
        income: 12000,
        expense: 7000,
        balance: 5000,
      },
      {
        month: "2026-06",
        income: 14000,
        expense: 8000,
        balance: 6000,
      },
    ],
    categoryTotals: [
      ["Market", 3000],
      ["Yemek", 2000],
      ["Ulaşım", 1000],
      ["Fatura", 500],
    ],
  });

  assert.equal(result.monthCount, 3);
  assert.equal(result.totalIncome, 36000);
  assert.equal(result.totalExpense, 21000);
  assert.equal(result.totalBalance, 15000);

  assertClose(
    result.averageMonthlyIncome,
    12000
  );
  assertClose(
    result.averageMonthlyExpense,
    7000
  );
  assertClose(
    result.averageMonthlyBalance,
    5000
  );

  assert.equal(result.positiveMonths, 3);

  assert.equal(result.incomeChange, 40);
  assertClose(
    result.expenseChange,
    33.33333333333333
  );
  assert.equal(result.balanceChange, 50);

  assert.equal(
    result.topCategories[0].category,
    "Market"
  );
  assertClose(
    result.topThreeShare,
    92.3076923076923
  );
});

test("advanced reports handle zero-data and zero-base changes safely", () => {
  const result = buildAdvancedReport({
    monthlyTrend: [
      {
        month: "2026-08",
        income: 0,
        expense: 0,
        balance: 0,
      },
      {
        month: "2026-09",
        income: 5000,
        expense: 3000,
        balance: 2000,
      },
    ],
    categoryTotals: [],
  });

  assert.equal(result.monthCount, 1);
  assert.equal(result.totalIncome, 5000);
  assert.equal(result.totalExpense, 3000);
  assert.equal(result.positiveMonths, 1);
  assert.equal(result.incomeChange, 0);
  assert.equal(result.expenseChange, 0);
  assert.equal(result.topThreeShare, 0);
});

test("advanced reports ignore invalid amounts", () => {
  const result = buildAdvancedReport({
    monthlyTrend: [
      {
        income: "1000",
        expense: "abc",
        balance: 1000,
      },
      {
        income: "hatalı",
        expense: 500,
        balance: -500,
      },
    ],
    categoryTotals: [
      ["Market", "1000"],
      ["Yemek", "hatalı"],
    ],
  });

  assert.equal(result.monthCount, 2);
  assert.equal(result.totalIncome, 1000);
  assert.equal(result.totalExpense, 500);
  assert.equal(result.totalBalance, 500);
  assert.equal(result.topCategories.length, 1);
});
