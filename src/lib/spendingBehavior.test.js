import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSpendingBehavior,
} from "./spendingBehavior.js";

const assertClose = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be close to ${expected}`
  );
};

test("spending behavior compares category changes between current and previous month", () => {
  const result = analyzeSpendingBehavior({
    currentTransactions: [
      {
        type: "expense",
        category: "Market",
        amount: 1200,
      },
      {
        type: "expense",
        category: "Yemek",
        amount: 800,
      },
      {
        type: "expense",
        category: "Ulaşım",
        amount: 300,
      },
      {
        type: "income",
        category: "Genel",
        amount: 5000,
      },
    ],
    previousTransactions: [
      {
        type: "expense",
        category: "Market",
        amount: 1000,
      },
      {
        type: "expense",
        category: "Yemek",
        amount: 1000,
      },
      {
        type: "expense",
        category: "Ulaşım",
        amount: 400,
      },
    ],
  });

  assert.equal(result.currentTotal, 2300);
  assert.equal(result.previousTotal, 2400);
  assert.equal(result.topCategory.category, "Market");
  assertClose(result.topCategory.share, 52.17391304347826);

  const market = result.analysis.find(
    (item) => item.category === "Market"
  );
  const yemek = result.analysis.find(
    (item) => item.category === "Yemek"
  );
  const ulasim = result.analysis.find(
    (item) => item.category === "Ulaşım"
  );

  assert.equal(market.changeType, "increase");
  assert.equal(market.changePercent, 20);

  assert.equal(yemek.changeType, "decrease");
  assert.equal(yemek.changePercent, -20);

  assert.equal(ulasim.changeType, "decrease");
  assert.equal(ulasim.changePercent, -25);

  assert.equal(result.changedCategoryCount, 3);
  assert.equal(
    result.largestIncrease.category,
    "Market"
  );
  assert.equal(
    result.largestDecrease.category,
    "Ulaşım"
  );
});

test("spending behavior detects a new category", () => {
  const result = analyzeSpendingBehavior({
    currentTransactions: [
      {
        type: "expense",
        category: "Eğlence",
        amount: 500,
      },
    ],
    previousTransactions: [],
  });

  assert.equal(result.currentTotal, 500);
  assert.equal(result.previousTotal, 0);
  assert.equal(result.newCategory.category, "Eğlence");
  assert.equal(
    result.newCategory.changeType,
    "new"
  );
  assert.equal(result.newCategory.changePercent, null);
});

test("spending behavior ignores invalid and non-expense records", () => {
  const result = analyzeSpendingBehavior({
    currentTransactions: [
      {
        type: "expense",
        category: "Market",
        amount: "1000",
      },
      {
        type: "expense",
        category: "Yemek",
        amount: "hatalı",
      },
      {
        type: "income",
        category: "Maaş",
        amount: 8000,
      },
      {
        type: "expense",
        category: "",
        amount: 200,
      },
    ],
  });

  assert.equal(result.currentTotal, 1200);
  assert.equal(result.analysis.length, 2);
  assert.equal(
    result.analysis[0].category,
    "Market"
  );
  assert.equal(
    result.analysis[1].category,
    "Genel"
  );
});
