// All figures are fictional sample data for October 2026. Nothing here comes from a real business.
// Totals are derived from the detailed lists so every widget stays consistent.

export const PERIOD = { label: "1 – 31 באוקטובר 2026", month: "אוקטובר 2026" };

export type Tone = "blue" | "purple" | "pink" | "amber" | "teal" | "gray" | "green" | "red";

// Daily income/expenses, 1–31 October 2026. Salaries (₪18,000) are paid 9–11/10.
const dailyIncome = [3600, 3800, 4850, 4000, 3600, 3050, 3200, 3550, 2550, 3050, 2600, 1900, 2900, 5050, 6150, 5050, 5900, 6450, 4700, 4100, 5650, 5550, 4900, 3900, 3850, 3100, 3900, 6250, 5750, 8450, 8650];
const dailyExpenses = [1750, 1600, 1800, 1750, 1700, 1650, 1250, 1400, 7100, 7150, 7000, 1150, 1100, 1650, 1700, 1150, 1900, 2300, 2200, 2250, 1950, 1850, 1850, 1450, 1700, 1650, 1400, 1600, 1550, 1550, 1500];

export const daily = dailyIncome.map((income, i) => ({
  label: `${i + 1}/10`,
  income,
  expenses: dailyExpenses[i],
}));

const weekRanges: [number, number][] = [[1, 7], [8, 14], [15, 21], [22, 28], [29, 31]];
export const weekly = weekRanges.map(([from, to]) => {
  const slice = daily.slice(from - 1, to);
  return {
    label: `${from}–${to}/10`,
    income: slice.reduce((s, d) => s + d.income, 0),
    expenses: slice.reduce((s, d) => s + d.expenses, 0),
  };
});

export const expenseCategories = [
  { name: "פרסום ומדיה", amount: 24000, tone: "blue", icon: "megaphone" },
  { name: "משכורות", amount: 18000, tone: "purple", icon: "users" },
  { name: "עמלות עובדים", amount: 8500, tone: "pink", icon: "percent" },
  { name: "הוצאות משרד", amount: 6200, tone: "amber", icon: "building" },
  { name: "תוכנות ומנויים", amount: 4900, tone: "teal", icon: "monitor" },
  { name: "הוצאות אחרות", amount: 6000, tone: "gray", icon: "more" },
] as const;

export const incomeSources = [
  { name: "לקוחות קיימים", amount: 52000, tone: "blue" },
  { name: "לקוחות חדשים", amount: 38000, tone: "purple" },
  { name: "קמפיינים ממומנים", amount: 26000, tone: "pink" },
  { name: "פרויקטים נוספים", amount: 14000, tone: "amber" },
  { name: "אחר", amount: 10000, tone: "gray" },
] as const;

const sum = (xs: readonly { amount: number }[]) => xs.reduce((s, x) => s + x.amount, 0);

export const totals = {
  income: sum(incomeSources), // 140,000
  expenses: sum(expenseCategories), // 67,600
  get profit() {
    return this.income - this.expenses; // 72,400
  },
};

export const cashFlow = [
  { month: "אוג׳ 2026", income: 112400, expenses: 59800 },
  { month: "ספט׳ 2026", income: 118600, expenses: 62600 },
  { month: "אוק׳ 2026", income: totals.income, expenses: totals.expenses },
];

const prev = cashFlow[1];
const pct = (now: number, before: number) => Math.round(((now - before) / before) * 100);
export const changes = {
  income: pct(totals.income, prev.income), // +18%
  expenses: pct(totals.expenses, prev.expenses), // +8%
  profit: pct(totals.profit, prev.income - prev.expenses), // +29%
};

// Commission = 6.25% of sales. Commissions sum to the ₪8,500 "עמלות עובדים" category.
export const COMMISSION_RATE = 0.0625;
export const employees = [
  { name: "דניאל", sales: 44800, target: 50000 },
  { name: "מאי", sales: 35200, target: 40000 },
  { name: "רון", sales: 25600, target: 40000 },
  { name: "יובל", sales: 30400, target: 30000 },
].map((e) => ({ ...e, commission: Math.round(e.sales * COMMISSION_RATE), progress: e.sales / e.target }));

export const notifications = [
  { title: "תקבול חדש מסטודיו אלפא", detail: "₪8,500 התקבלו בחשבון", time: "לפני שעה" },
  { title: "יובל עבר את יעד החודש", detail: "101% מהיעד החודשי", time: "אתמול" },
  { title: "תזכורת: דיווח מע״מ", detail: "יש להגיש עד 15/11/2026", time: "לפני יומיים" },
];
