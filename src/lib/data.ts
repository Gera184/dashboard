// Pure calculations over the data you enter. Nothing here is sample data.
import type { Employee, Entry, Loan, Order, Sale, Store } from "./store";

export type Tone = "blue" | "purple" | "pink" | "amber" | "teal" | "gray" | "green" | "red";
export type CatIcon = "megaphone" | "users" | "percent" | "building" | "monitor" | "car" | "truck" | "bank" | "more";

const PALETTE: Tone[] = ["blue", "purple", "pink", "amber", "teal", "gray"];
const MAX_SLICES = 6;
export const OTHER_LABEL = "אחר";

export const EXPENSE_CATEGORIES = [
  "פרסום ומדיה", "משכורות", "עמלות עובדים", "הוצאות משרד", "שכירות",
  "תוכנות ומנויים", "ספקים", "רכב ונסיעות", "הוצאות אחרות",
];
export const INCOME_SOURCES = ["לקוחות קיימים", "לקוחות חדשים", "קמפיינים ממומנים", "פרויקטים נוספים", "אחר"];

const ICON_BY_CATEGORY: Record<string, CatIcon> = {
  "פרסום ומדיה": "megaphone", "פרסום": "megaphone", "שיווק": "megaphone",
  "משכורות": "users", "שכר": "users", "החזרי הלוואות": "bank",
  "עמלות עובדים": "percent", "עמלות": "percent",
  "הוצאות משרד": "building", "שכירות": "building", "משרד": "building",
  "תוכנות ומנויים": "monitor", "תוכנות": "monitor",
  "רכב ונסיעות": "car", "רכב": "car",
  "ספקים": "truck",
};

// ---------- Dates ----------
const TZ = "Asia/Jerusalem";
export const todayISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
export const currentMonth = () => todayISO().slice(0, 7);
export const monthOf = (date: string) => date.slice(0, 7);

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonthKey = (s: unknown): s is string => typeof s === "string" && MONTH_RE.test(s);

function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
const daysIn = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
const monthName = (key: string, month: "long" | "short") => {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("he-IL", { month, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
};
export const monthLabel = (key: string) => `${monthName(key, "long")} ${key.slice(0, 4)}`;
export const periodLabel = (key: string) => `1 – ${daysIn(key)} ב${monthName(key, "long")} ${key.slice(0, 4)}`;
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m}/${y}`;
};

/** Months that have data, newest first, always including the current month. */
export function availableMonths(store: Store) {
  const now = currentMonth();
  const set = new Set<string>([now]);
  for (const e of store.entries) set.add(monthOf(e.date));
  for (const s of store.sales) set.add(monthOf(s.date));
  for (const o of store.orders) {
    set.add(monthOf(o.date));
    if (o.paidDate) set.add(monthOf(o.paidDate));
  }
  // Loan repayments, up to the current month (future months would flood the list).
  for (const l of store.loans) {
    for (let i = 0, key = monthOf(l.firstPayment); i < l.payments && key <= now; i++, key = shiftMonth(key, 1)) set.add(key);
  }
  return [...set].sort().reverse();
}

/** The month to show: ?month=YYYY-MM if valid, otherwise the current month. */
export function resolveMonth(param: string | string[] | undefined) {
  const v = Array.isArray(param) ? param[0] : param;
  return isMonthKey(v) ? v : currentMonth();
}

/** Default date for a new entry: today when viewing this month, else the 1st of the viewed month. */
export const defaultDateFor = (month: string) => (month === currentMonth() ? todayISO() : `${month}-01`);

// ---------- Aggregations ----------
const sumBy = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export const entriesFor = (store: Store, month: string, type?: Entry["type"]) =>
  store.entries
    .filter((e) => monthOf(e.date) === month && (!type || e.type === type))
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));

export const SALES_PREFIX = "מכירות: ";
export const SALARY_CATEGORY = "משכורות";
export const LOAN_CATEGORY = "החזרי הלוואות";

/** Manual entries that are not salaries (salaries have their own page). */
export const plainEntriesFor = (store: Store, month: string, type: Entry["type"]) =>
  entriesFor(store, month, type).filter((e) => !(type === "expense" && e.category === SALARY_CATEGORY));
export const salariesFor = (store: Store, month: string) =>
  entriesFor(store, month, "expense").filter((e) => e.category === SALARY_CATEGORY);

// ---------- Loans ----------
const monthDiff = (a: string, b: string) => (Number(a.slice(0, 4)) - Number(b.slice(0, 4))) * 12 + Number(a.slice(5, 7)) - Number(b.slice(5, 7));

/** 1-based number of the repayment that falls in `month`, or 0 if none. */
function paymentIndex(loan: Loan, month: string) {
  const i = monthDiff(month, monthOf(loan.firstPayment)) + 1;
  return i >= 1 && i <= loan.payments ? i : 0;
}

export type LoanRow = Loan & { paid: number; remaining: number; remainingAmount: number; dueThisMonth: boolean; endMonth: string };

export function loanRows(store: Store, month: string): LoanRow[] {
  return store.loans.map((l) => {
    const elapsed = Math.max(0, Math.min(l.payments, monthDiff(month, monthOf(l.firstPayment)) + 1));
    return {
      ...l,
      paid: elapsed,
      remaining: l.payments - elapsed,
      remainingAmount: round2((l.payments - elapsed) * l.monthlyPayment),
      dueThisMonth: paymentIndex(l, month) > 0,
      endMonth: shiftMonth(monthOf(l.firstPayment), l.payments - 1),
    };
  }).sort((a, b) => b.remainingAmount - a.remainingAmount);
}

// ---------- Orders ----------
const paidIn = (o: Order, month: string) => !!o.paidDate && monthOf(o.paidDate) === month;
/** Not yet paid at the end of `month` (paid later, or not at all). */
const openAt = (o: Order, month: string) => !o.paidDate || monthOf(o.paidDate) > month;

/** Orders that matter in `month`: paid during it, or placed by its end and still open at its end. */
const relevantOrders = (store: Store, month: string) =>
  store.orders.filter((o) => paidIn(o, month) || (monthOf(o.date) <= month && openAt(o, month)));

export function ordersFor(store: Store, month: string) {
  return relevantOrders(store, month).sort(
    (a, b) => Number(!openAt(a, month)) - Number(!openAt(b, month)) || b.date.localeCompare(a.date),
  );
}

/** Payments made during `month` (by payment date) and what is still open at its end. */
export function orderStats(store: Store, month: string) {
  const relevant = relevantOrders(store, month);
  const paid = relevant.filter((o) => paidIn(o, month));
  const open = relevant.filter((o) => openAt(o, month));
  // a client counts as paid when they paid this month and have nothing left open
  const openClients = new Set(open.map((o) => o.client));
  const paidClients = new Set(paid.map((o) => o.client).filter((c) => !openClients.has(c)));
  return {
    orders: relevant.length,
    paidOrders: paid.length,
    clients: new Set(relevant.map((o) => o.client)).size,
    paidClients: paidClients.size,
    paidAmount: round2(sumBy(paid, (o) => o.amount)),
    openAmount: round2(sumBy(open, (o) => o.amount)),
    unpaid: open.sort((a, b) => a.date.localeCompare(b.date)) as Order[],
  };
}
export type OrderStats = ReturnType<typeof orderStats>;

/** Everything that counts toward the totals: manual entries plus each agent's sales as income. */
function ledger(store: Store, month: string): Entry[] {
  const names = new Map(store.employees.map((e) => [e.id, e.name]));
  const sales: Entry[] = store.sales
    .filter((x) => monthOf(x.date) === month && names.has(x.employeeId))
    .map((x) => ({ id: x.id, type: "income", date: x.date, category: `${SALES_PREFIX}${names.get(x.employeeId)}`, amount: x.amount, createdAt: x.createdAt }));
  const loans: Entry[] = store.loans
    .filter((l) => paymentIndex(l, month) > 0)
    .map((l) => ({ id: l.id, type: "expense", date: `${month}-${String(Math.min(Number(l.firstPayment.slice(8)), daysIn(month))).padStart(2, "0")}`, category: LOAN_CATEGORY, amount: l.monthlyPayment, createdAt: l.createdAt }));
  return [...entriesFor(store, month), ...sales, ...loans];
}

function monthTotals(store: Store, month: string) {
  const list = ledger(store, month);
  const income = round2(sumBy(list.filter((e) => e.type === "income"), (e) => e.amount));
  const expenses = round2(sumBy(list.filter((e) => e.type === "expense"), (e) => e.amount));
  return { income, expenses, profit: round2(income - expenses), count: list.length };
}

export type Slice = { name: string; amount: number; tone: Tone; icon: CatIcon };

function groupByCategory(list: Entry[]): Slice[] {
  const map = new Map<string, number>();
  for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  let rows = [...map.entries()].map(([name, amount]) => ({ name, amount: round2(amount) })).sort((a, b) => b.amount - a.amount);
  if (rows.length > MAX_SLICES) {
    const head = rows.slice(0, MAX_SLICES - 1);
    const rest = round2(sumBy(rows.slice(MAX_SLICES - 1), (r) => r.amount));
    rows = [...head, { name: OTHER_LABEL, amount: rest }];
  }
  return rows.map((r, i) => ({ ...r, tone: PALETTE[i % PALETTE.length], icon: ICON_BY_CATEGORY[r.name] ?? "more" }));
}

const pctChange = (now: number, before: number) =>
  before === 0 ? null : Math.round(((now - before) / Math.abs(before)) * 100);

export type EmployeeRow = Employee & { sales: number; commission: number; progress: number | null; salesCount: number };

/** Active agents, plus archived ones who have sales in `month` (so past months stay complete). */
export function employeeRows(store: Store, month: string, { includeArchived = false } = {}): EmployeeRow[] {
  return store.employees
    .map((e) => {
      const mine = store.sales.filter((s) => s.employeeId === e.id && monthOf(s.date) === month);
      const sales = round2(sumBy(mine, (s) => s.amount));
      return {
        ...e,
        sales,
        salesCount: mine.length,
        commission: round2((sales * e.commissionRate) / 100),
        progress: e.target > 0 ? sales / e.target : null,
      };
    })
    .filter((r) => includeArchived || !r.archived || r.salesCount > 0)
    .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name, "he"));
}

export const salesFor = (store: Store, month: string): Sale[] =>
  store.sales
    .filter((s) => monthOf(s.date) === month)
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));

export type Point = { label: string; income: number; expenses: number };

export function summarize(store: Store, month: string) {
  const totals = monthTotals(store, month);
  const prevKey = shiftMonth(month, -1);
  const prev = monthTotals(store, prevKey);
  const hasPrev = prev.count > 0;
  const m = Number(month.slice(5));

  const list = ledger(store, month);
  const days = daysIn(month);
  const daily: Point[] = Array.from({ length: days }, (_, i) => ({ label: `${i + 1}/${m}`, income: 0, expenses: 0 }));
  for (const e of list) {
    const d = daily[Number(e.date.slice(8)) - 1];
    if (!d) continue;
    if (e.type === "income") d.income = round2(d.income + e.amount);
    else d.expenses = round2(d.expenses + e.amount);
  }
  const weekly: Point[] = [];
  for (let from = 1; from <= days; from += 7) {
    const to = Math.min(from + 6, days);
    const slice = daily.slice(from - 1, to);
    weekly.push({
      label: `${from}–${to}/${m}`,
      income: round2(sumBy(slice, (d) => d.income)),
      expenses: round2(sumBy(slice, (d) => d.expenses)),
    });
  }

  const cashFlow = Array.from({ length: 12 }, (_, i) => i - 11).map((delta) => {
    const key = shiftMonth(month, delta);
    const t = monthTotals(store, key);
    return { month: `${monthName(key, "short")} ${key.slice(0, 4)}`, income: t.income, expenses: t.expenses };
  });

  return {
    month,
    label: monthLabel(month),
    totals,
    hasPrev,
    changes: hasPrev
      ? { income: pctChange(totals.income, prev.income), expenses: pctChange(totals.expenses, prev.expenses), profit: pctChange(totals.profit, prev.profit) }
      : { income: null, expenses: null, profit: null },
    daily,
    weekly,
    expenseCategories: groupByCategory(list.filter((e) => e.type === "expense")),
    incomeSources: groupByCategory(list.filter((e) => e.type === "income")),
    cashFlow,
    employees: employeeRows(store, month),
    orders: orderStats(store, month),
    salaries: round2(sumBy(salariesFor(store, month), (e) => e.amount)),
    loanPayments: round2(sumBy(list.filter((e) => e.category === LOAN_CATEGORY && e.type === "expense"), (e) => e.amount)),
  };
}

export type Summary = ReturnType<typeof summarize>;

/** Category names to suggest in the form: presets first, then anything you have used before. */
export function categorySuggestions(store: Store, type: Entry["type"]) {
  const presets = type === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES.filter((c) => c !== SALARY_CATEGORY);
  const used = store.entries.filter((e) => e.type === type && e.category !== SALARY_CATEGORY).map((e) => e.category);
  return [...new Set([...presets, ...used])];
}
