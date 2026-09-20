import test from "node:test";
import assert from "node:assert/strict";
import {
  validateBudget,
  validateGoal,
  validateSubscription,
  validateTransaction,
} from "./validation.js";
import { calculateTotals } from "./finance.js";

test("transaction validation rejects empty title", () => {
  assert.equal(
    validateTransaction({ amount: "100", date: "2026-09-15" }),
    "İşlem açıklaması gerekli."
  );
});

test("transaction validation rejects zero amount", () => {
  assert.equal(
    validateTransaction({
      title: "Market",
      amount: "0",
      date: "2026-09-15",
    }),
    "İşlem tutarı 0'dan büyük olmalı."
  );
});

test("goal validation rejects saved amount above target", () => {
  assert.equal(
    validateGoal({ title: "Acil durum", target: "1000", saved: "1200" }),
    "Birikmiş tutar hedef tutarını aşamaz."
  );
});

test("subscription validation accepts a valid payment day", () => {
  assert.equal(
    validateSubscription({ title: "Müzik", amount: "99", day: "15" }),
    ""
  );
});

test("budget validation accepts zero", () => {
  assert.equal(validateBudget("0"), "");
});

test("finance totals calculate income, expense, and balance", () => {
  assert.deepEqual(
    calculateTotals([
      { type: "income", amount: "5000" },
      { type: "expense", amount: "1200" },
      { type: "expense", amount: 300 },
    ]),
    { income: 5000, expense: 1500, balance: 3500 }
  );
});

test("finance totals preserve a negative balance", () => {
  assert.deepEqual(
    calculateTotals([
      { type: "income", amount: 1000 },
      { type: "expense", amount: 1400 },
    ]),
    { income: 1000, expense: 1400, balance: -400 }
  );
});

test("transaction validation rejects non-finite amount", () => {
  assert.equal(
    validateTransaction({
      title: "Market",
      amount: Infinity,
      date: "2026-09-15",
    }),
    "İşlem tutarı 0'dan büyük olmalı."
  );
});

test("finance totals ignore non-finite amounts", () => {
  assert.deepEqual(
    calculateTotals([
      { type: "income", amount: 5000 },
      { type: "income", amount: Infinity },
      { type: "expense", amount: 1200 },
      { type: "expense", amount: NaN },
    ]),
    { income: 5000, expense: 1200, balance: 3800 }
  );
});
