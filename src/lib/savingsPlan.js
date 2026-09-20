const toFiniteAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const normalizeDays = (value) => {
  const days = Number(value);
  return Number.isFinite(days) ? days : null;
};

export function calculateSavingsPlan({
  goals = [],
  totals = {},
  daysUntil = () => null,
} = {}) {
  const income = Math.max(
    toFiniteAmount(totals.income),
    0
  );
  const balance = toFiniteAmount(totals.balance);
  const monthlyCapacity = Math.max(balance, 0);

  const activeGoals = goals
    .map((goal) => {
      const target = Math.max(
        toFiniteAmount(goal.target),
        0
      );
      const saved = Math.max(
        toFiniteAmount(goal.saved),
        0
      );
      const remaining = Math.max(
        target - saved,
        0
      );

      return {
        ...goal,
        target,
        saved,
        remaining,
        daysRemaining: goal.deadline
          ? normalizeDays(daysUntil(goal.deadline))
          : null,
      };
    })
    .filter(
      (goal) =>
        goal.target > 0 &&
        goal.remaining > 0
    );

  const totalRemaining = activeGoals.reduce(
    (sum, goal) => sum + goal.remaining,
    0
  );

  const priorityGoal = [...activeGoals].sort(
    (a, b) => {
      const aDays = a.daysRemaining;
      const bDays = b.daysRemaining;

      if (aDays !== null && bDays !== null) {
        return aDays - bDays;
      }

      if (aDays !== null) return -1;
      if (bDays !== null) return 1;

      return b.remaining - a.remaining;
    }
  )[0] || null;

  const savingsRate =
    income > 0
      ? (balance / income) * 100
      : 0;

  if (!priorityGoal) {
    return {
      status: "empty",
      income,
      balance,
      monthlyCapacity,
      savingsRate,
      activeGoalCount: 0,
      totalRemaining: 0,
      priorityGoal: null,
      requiredMonthly: null,
      requiredWeekly: null,
      capacityGap: null,
    };
  }

  const daysRemaining =
    priorityGoal.daysRemaining;

  if (
    daysRemaining !== null &&
    daysRemaining < 0
  ) {
    return {
      status: "overdue",
      income,
      balance,
      monthlyCapacity,
      savingsRate,
      activeGoalCount: activeGoals.length,
      totalRemaining,
      priorityGoal,
      requiredMonthly: null,
      requiredWeekly: null,
      capacityGap: null,
    };
  }

  if (daysRemaining === null) {
    return {
      status: "no-deadline",
      income,
      balance,
      monthlyCapacity,
      savingsRate,
      activeGoalCount: activeGoals.length,
      totalRemaining,
      priorityGoal,
      requiredMonthly: null,
      requiredWeekly: null,
      capacityGap: null,
    };
  }

  const daysToTarget = Math.max(
    1,
    daysRemaining
  );

  const requiredDaily =
    priorityGoal.remaining / daysToTarget;

  const requiredWeekly =
    requiredDaily * 7;

  const requiredMonthly =
    requiredDaily * 30.44;

  const monthsRemaining =
    daysToTarget / 30.44;

  const capacityGap =
    requiredMonthly - monthlyCapacity;

  return {
    status:
      capacityGap <= 0
        ? "on-track"
        : "gap",
    income,
    balance,
    monthlyCapacity,
    savingsRate,
    activeGoalCount: activeGoals.length,
    totalRemaining,
    priorityGoal: {
      ...priorityGoal,
      monthsRemaining,
    },
    requiredMonthly,
    requiredWeekly,
    capacityGap,
  };
}
