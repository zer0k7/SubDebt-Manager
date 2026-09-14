import { SpendingEntry } from '../hooks/useDailySpending';
import { Subscription } from '../hooks/useSubscriptions';
import { Debt } from '../hooks/useDebts';
import { IncomeEntry } from '../hooks/useIncome';

export interface CashflowForecastResult {
  dailyBurnRate: number;
  upcomingSubsTotal: number;
  upcomingDebtsTotal: number;
  expectedIncomeTotal: number;
  projected30DayOutflow: number;
  netCashflowProjected: number;
  daysRunway?: number;
}

export interface PriceHikeAlert {
  subscriptionId: string;
  name: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  percentIncrease: number;
}

/**
 * Calculates 30-day projected cashflow, daily burn rate, and runway.
 */
export const calculateCashflowForecast = (
  spendingEntries: SpendingEntry[],
  subscriptions: Subscription[],
  debts: Debt[],
  incomes: IncomeEntry[],
  currentBalance: number = 0,
  convertFn?: (amount: number, currency: string) => number
): CashflowForecastResult => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Calculate average daily burn rate based on past 30 days
  const recentEntries = spendingEntries.filter((e) => {
    const d = new Date(e.spentAt);
    return d >= thirtyDaysAgo && d <= now;
  });

  const recentSpendingTotal = recentEntries.reduce((sum, e) => {
    return sum + (convertFn ? convertFn(e.amount, e.currency) : e.amount);
  }, 0);

  const dailyBurnRate = recentSpendingTotal > 0 ? recentSpendingTotal / 30 : 0;

  // 2. Upcoming subscriptions due in the next 30 days
  const thirtyDaysAhead = new Date(now);
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const upcomingSubsTotal = activeSubs.reduce((sum, s) => {
    const cost = convertFn ? convertFn(s.amount, s.currency) : s.amount;
    const cycle = s.billingCycle.toLowerCase();
    if (cycle === 'monthly') return sum + cost;
    if (cycle === 'weekly') return sum + cost * 4.2;
    if (cycle === 'yearly') {
      const renew = new Date(s.expiryDate || s.startDate);
      if (renew >= now && renew <= thirtyDaysAhead) {
        return sum + cost;
      }
    }
    return sum;
  }, 0);

  // 3. Upcoming debts due in the next 30 days
  const unpaidDebts = debts.filter((d) => !d.isPaid);
  const upcomingDebtsTotal = unpaidDebts.reduce((sum, d) => {
    const amt = convertFn ? convertFn(d.amount, d.currency) : d.amount;
    if (d.dueDate) {
      const due = new Date(d.dueDate);
      if (due >= now && due <= thirtyDaysAhead) {
        return sum + amt;
      }
    }
    return sum;
  }, 0);

  // 4. Expected incoming salary / income in next 30 days
  const expectedIncomeTotal = incomes.reduce((sum, inc) => {
    const amt = convertFn ? convertFn(inc.amount, inc.currency) : inc.amount;
    if (inc.isRecurring) {
      return sum + amt;
    }
    return sum;
  }, 0);

  // 5. Projected 30-day outflow
  const projected30DayOutflow = dailyBurnRate * 30 + upcomingSubsTotal + upcomingDebtsTotal;
  const netCashflowProjected = expectedIncomeTotal - projected30DayOutflow;

  // 6. Days of runway remaining
  let daysRunway: number | undefined = undefined;
  if (currentBalance > 0 && dailyBurnRate > 0) {
    daysRunway = Math.floor(currentBalance / dailyBurnRate);
  }

  return {
    dailyBurnRate,
    upcomingSubsTotal,
    upcomingDebtsTotal,
    expectedIncomeTotal,
    projected30DayOutflow,
    netCashflowProjected,
    daysRunway,
  };
};

/**
 * Detects whether any active subscriptions recently increased in price compared to past logged expenses.
 */
export const detectSubscriptionPriceHikes = (
  subscriptions: Subscription[],
  spendingEntries: SpendingEntry[]
): PriceHikeAlert[] => {
  const alerts: PriceHikeAlert[] = [];

  subscriptions
    .filter((s) => s.isActive && s.amount > 0)
    .forEach((sub) => {
      const matchingExpenses = spendingEntries.filter(
        (e) =>
          e.title.toLowerCase().includes(sub.name.toLowerCase()) ||
          sub.name.toLowerCase().includes(e.title.toLowerCase())
      );

      if (matchingExpenses.length > 0) {
        // Find previous charges that are lower than current subscription amount
        const previousLower = matchingExpenses.find((e) => e.amount < sub.amount * 0.95);
        if (previousLower) {
          const diff = sub.amount - previousLower.amount;
          const pct = Math.round((diff / previousLower.amount) * 100);
          alerts.push({
            subscriptionId: sub.id,
            name: sub.name,
            currentAmount: sub.amount,
            previousAmount: previousLower.amount,
            difference: diff,
            percentIncrease: pct,
          });
        }
      }
    });

  return alerts;
};
