import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSubscriptionIntelligence,
} from "./subscriptionIntelligence.js";

const today = new Date(
  2026,
  8,
  20,
  12,
  0,
  0
);

test("subscription intelligence separates income, expense and finds next payment", () => {
  const result =
    analyzeSubscriptionIntelligence({
      subscriptions: [
        {
          id: "netflix",
          title: "Dizi",
          type: "expense",
          amount: 500,
          day: 22,
        },
        {
          id: "internet",
          title: "İnternet",
          type: "expense",
          amount: 700,
          day: 28,
        },
        {
          id: "salary",
          title: "Maaş",
          type: "income",
          amount: 20000,
          day: 25,
        },
      ],
      today,
    });

  assert.equal(result.totalCount, 3);
  assert.equal(result.expenseCount, 2);
  assert.equal(result.incomeCount, 1);
  assert.equal(result.monthlyExpense, 1200);
  assert.equal(result.monthlyIncome, 20000);
  assert.equal(result.monthlyNet, 18800);
  assert.equal(result.nextPayment.title, "Dizi");
  assert.equal(result.nextPayment.daysUntil, 2);
  assert.equal(result.upcomingSevenDaysCount, 2);
  assert.equal(
    result.largestExpense.title,
    "İnternet"
  );
  assert.equal(result.incomeCoverage, 6);
});

test("subscription intelligence rolls a passed payment into the next month", () => {
  const result =
    analyzeSubscriptionIntelligence({
      subscriptions: [
        {
          title: "Bulut",
          type: "expense",
          amount: 300,
          day: 10,
        },
      ],
      today,
    });

  assert.equal(
    result.nextPayment.paymentDate,
    "2026-10-10"
  );

  assert.equal(
    result.nextPayment.daysUntil,
    20
  );

  assert.equal(
    result.upcomingSevenDaysCount,
    0
  );
});

test("subscription intelligence ignores invalid records safely", () => {
  const result =
    analyzeSubscriptionIntelligence({
      subscriptions: [
        {
          title: "Geçerli",
          type: "expense",
          amount: "100",
          day: 31,
        },
        {
          title: "Hatalı tutar",
          type: "expense",
          amount: "abc",
          day: 5,
        },
        {
          title: "Hatalı gün",
          type: "expense",
          amount: 200,
          day: 0,
        },
        {
          title: "Gelir",
          type: "income",
          amount: 1000,
          day: 26,
        },
      ],
      today,
    });

  assert.equal(result.totalCount, 2);
  assert.equal(result.monthlyExpense, 100);
  assert.equal(result.monthlyIncome, 1000);
  assert.equal(result.monthlyNet, 900);
});
