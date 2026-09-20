import test from "node:test";
import assert from "node:assert/strict";
import { buildCashFlowCalendar } from "./cashFlowCalendar.js";

test("cash flow calendar includes future transactions and next subscription payment", () => {
  const events = buildCashFlowCalendar({
    now: new Date(
      "2026-09-20T10:00:00+03:00"
    ),
    transactions: [
      {
        id: "t1",
        title: "Maaş",
        type: "income",
        category: "Genel",
        amount: 30000,
        date: "2026-09-25",
      },
      {
        id: "t2",
        title: "Planlı kira",
        type: "expense",
        category: "Kira",
        amount: 12000,
        date: "2026-10-01",
      },
    ],
    subscriptions: [
      {
        id: "s1",
        title: "İnternet",
        type: "expense",
        amount: 500,
        day: 23,
      },
    ],
  });

  assert.equal(
    events.length,
    3
  );

  assert.deepEqual(
    events.map((event) => event.date),
    [
      "2026-09-23",
      "2026-09-25",
      "2026-10-01",
    ]
  );
});

test("cash flow calendar rolls subscriptions into the next month", () => {
  const events = buildCashFlowCalendar({
    now: new Date(
      "2026-09-30T10:00:00+03:00"
    ),
    subscriptions: [
      {
        id: "s1",
        title: "Kredi",
        type: "expense",
        amount: 2500,
        day: 5,
      },
    ],
  });

  assert.equal(
    events[0]?.date,
    "2026-10-05"
  );
});

test("cash flow calendar ignores past, invalid and unsupported records", () => {
  const events = buildCashFlowCalendar({
    now: new Date(
      "2026-09-20T10:00:00+03:00"
    ),
    transactions: [
      {
        title: "Geçmiş",
        type: "expense",
        amount: 100,
        date: "2026-09-19",
      },
      {
        title: "Geçersiz",
        type: "expense",
        amount: "abc",
        date: "2026-09-21",
      },
      {
        title: "Desteklenmeyen",
        type: "transfer",
        amount: 500,
        date: "2026-09-22",
      },
    ],
    subscriptions: [
      {
        title: "Bozuk",
        type: "expense",
        amount: 100,
        day: 99,
      },
    ],
  });

  assert.equal(
    events.length,
    0
  );
});
