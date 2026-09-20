import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSavingsPlan,
} from "./savingsPlan.js";

const assertClose = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.000001,
    `Expected ${actual} to be close to ${expected}`
  );
};

test("savings plan calculates required monthly amount and detects sufficient capacity", () => {
  const plan = calculateSavingsPlan({
    goals: [
      {
        id: "goal-1",
        title: "Tatil Fonu",
        target: 10000,
        saved: 4000,
        deadline: "2026-11-01",
      },
    ],
    totals: {
      income: 20000,
      balance: 3500,
    },
    daysUntil: () => 60,
  });

  assert.equal(plan.activeGoalCount, 1);
  assert.equal(plan.totalRemaining, 6000);
  assertClose(plan.requiredMonthly, 3044);
  assertClose(plan.requiredWeekly, 700);
  assert.equal(plan.monthlyCapacity, 3500);
  assertClose(plan.capacityGap, -456);
  assert.equal(plan.status, "on-track");
});

test("savings plan reports the capacity gap when required savings exceed current capacity", () => {
  const plan = calculateSavingsPlan({
    goals: [
      {
        id: "goal-1",
        title: "Acil Durum Fonu",
        target: 12000,
        saved: 2000,
        deadline: "2026-12-01",
      },
    ],
    totals: {
      income: 18000,
      balance: 1500,
    },
    daysUntil: () => 90,
  });

  assert.equal(plan.totalRemaining, 10000);
  assertClose(plan.requiredMonthly, 3382.2222222222226);
  assert.equal(plan.monthlyCapacity, 1500);
  assert.equal(plan.status, "gap");
  assertClose(plan.capacityGap, 1882.2222222222226);
});

test("savings plan handles overdue, no-deadline and empty goals safely", () => {
  const overdue = calculateSavingsPlan({
    goals: [
      {
        title: "Eski Hedef",
        target: 5000,
        saved: 1000,
        deadline: "2026-09-01",
      },
    ],
    totals: {
      income: 10000,
      balance: -500,
    },
    daysUntil: () => -19,
  });

  assert.equal(overdue.status, "overdue");
  assert.equal(overdue.monthlyCapacity, 0);
  assert.equal(overdue.requiredMonthly, null);

  const noDeadline = calculateSavingsPlan({
    goals: [
      {
        title: "Yeni Hedef",
        target: 5000,
        saved: 1000,
        deadline: "",
      },
    ],
    totals: {
      income: 10000,
      balance: 2000,
    },
  });

  assert.equal(noDeadline.status, "no-deadline");
  assert.equal(noDeadline.monthlyCapacity, 2000);
  assert.equal(noDeadline.totalRemaining, 4000);

  const empty = calculateSavingsPlan({
    goals: [],
    totals: {
      income: 10000,
      balance: 1000,
    },
  });

  assert.equal(empty.status, "empty");
  assert.equal(empty.activeGoalCount, 0);
});
