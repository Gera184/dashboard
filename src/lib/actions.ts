"use client";

// Form handlers. They validate input and save to this browser (local-store.ts); nothing goes to the server.
import { newId, updateStore } from "./local-store";
import type { EntryType } from "./types";
import { LOAN_CATEGORY, SALARY_CATEGORY } from "./data";

export type FormState = { ok?: boolean; error?: string; nonce?: number } | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1_000_000_000;

const text = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function parseAmount(raw: FormDataEntryValue | null, { allowZero = false } = {}) {
  const s = String(raw ?? "").replace(/[₪,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n > MAX_AMOUNT || (!allowZero && n <= 0)) return null;
  return n;
}

function parseDate(raw: FormDataEntryValue | null) {
  const s = String(raw ?? "");
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return null;
  const y = d.getUTCFullYear();
  return y >= 2000 && y <= 2100 ? s : null;
}

/** Turns a failed browser save (storage full or blocked) into a form error instead of a crash. */
export function guard(fn: (prev: FormState, fd: FormData) => Promise<FormState>) {
  return async (prev: FormState, fd: FormData): Promise<FormState> => {
    try {
      return await fn(prev, fd);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "השמירה נכשלה." };
    }
  };
}

const done = (): FormState => ({ ok: true, nonce: Date.now() });

// ---------- Income / expense entries ----------
export async function addEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  const type = fd.get("type") as EntryType;
  if (type !== "income" && type !== "expense") return { error: "סוג רשומה לא תקין." };
  const date = parseDate(fd.get("date"));
  const category = text(fd, "category", 60);
  const amount = parseAmount(fd.get("amount"));
  const note = text(fd, "note", 200);
  const person = text(fd, "person", 60);
  if (!date) return { error: "יש לבחור תאריך תקין." };
  if (fd.has("person") && !person) return { error: "יש לבחור או לכתוב שם עובד." };
  if (!category) return { error: type === "income" ? "יש לבחור או לכתוב מקור הכנסה." : "יש לבחור או לכתוב קטגוריה." };
  // These names are used by the salaries page and by automatic loan repayments.
  if (category === SALARY_CATEGORY && !fd.has("person")) return { error: "משכורות נרשמות בעמוד משכורות. בחרו שם קטגוריה אחר." };
  if (category === LOAN_CATEGORY) return { error: "החזרי הלוואות מחושבים אוטומטית מעמוד הלוואות. בחרו שם קטגוריה אחר." };
  if (amount === null) return { error: "יש להזין סכום חיובי (עד שתי ספרות אחרי הנקודה)." };

  updateStore((s) => {
    s.entries.push({ id: newId(), type, date, category, amount, note: note || undefined, person: person || undefined, createdAt: new Date().toISOString() });
  });
  return done();
}

export async function deleteEntry(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  updateStore((s) => {
    s.entries = s.entries.filter((e) => e.id !== id);
  }, { beforeDelete: true });
}

// ---------- Employees ----------
export async function addEmployee(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name", 60);
  const target = parseAmount(fd.get("target") || "0", { allowZero: true });
  const rate = parseAmount(fd.get("commissionRate") || "0", { allowZero: true });
  if (!name) return { error: "יש להזין שם נציג." };
  if (target === null) return { error: "יעד חודשי חייב להיות מספר (אפשר 0)." };
  if (rate === null || rate > 100) return { error: "אחוז עמלה חייב להיות בין 0 ל-100." };

  const dup = updateStore((s) => {
    if (s.employees.some((e) => e.name === name)) return true;
    s.employees.push({ id: newId(), name, target, commissionRate: rate, createdAt: new Date().toISOString() });
    return false;
  });
  if (dup) return { error: "כבר קיים נציג בשם הזה." };
  return done();
}

export async function updateEmployee(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get("id") ?? "");
  const target = parseAmount(fd.get("target") || "0", { allowZero: true });
  const rate = parseAmount(fd.get("commissionRate") || "0", { allowZero: true });
  if (target === null) return { error: "יעד לא תקין." };
  if (rate === null || rate > 100) return { error: "אחוז עמלה לא תקין." };
  updateStore((s) => {
    const e = s.employees.find((x) => x.id === id);
    if (e) Object.assign(e, { target, commissionRate: rate });
  });
  return done();
}

/** Deletes an agent only if they have no sales; otherwise past months' income would change. Archive them instead. */
export async function deleteEmployee(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  updateStore((s) => {
    if (s.sales.some((x) => x.employeeId === id)) return;
    s.employees = s.employees.filter((e) => e.id !== id);
  }, { beforeDelete: true });
}

/** Archive (left the business) or restore an agent. Their sales stay in every month's totals. */
export async function setEmployeeArchived(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const archived = fd.get("archived") === "1";
  updateStore((s) => {
    const e = s.employees.find((x) => x.id === id);
    if (e) e.archived = archived || undefined;
  });
}

// ---------- Sales (drive commissions) ----------
export async function addSale(_prev: FormState, fd: FormData): Promise<FormState> {
  const employeeId = String(fd.get("employeeId") ?? "");
  const date = parseDate(fd.get("date"));
  const amount = parseAmount(fd.get("amount"));
  const note = text(fd, "note", 200);
  if (!date) return { error: "יש לבחור תאריך תקין." };
  if (amount === null) return { error: "יש להזין סכום מכירה חיובי." };

  const ok = updateStore((s) => {
    if (!s.employees.some((e) => e.id === employeeId && !e.archived)) return false;
    s.sales.push({ id: newId(), employeeId, date, amount, note: note || undefined, createdAt: new Date().toISOString() });
    return true;
  });
  if (!ok) return { error: "יש לבחור נציג." };
  return done();
}

export async function deleteSale(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  updateStore((s) => {
    s.sales = s.sales.filter((x) => x.id !== id);
  }, { beforeDelete: true });
}

// ---------- Loans ----------
export async function addLoan(_prev: FormState, fd: FormData): Promise<FormState> {
  const lender = text(fd, "lender", 60);
  const amount = parseAmount(fd.get("amount"), { allowZero: true });
  const monthlyPayment = parseAmount(fd.get("monthlyPayment"));
  const firstPayment = parseDate(fd.get("firstPayment"));
  const payments = Number(fd.get("payments"));
  const note = text(fd, "note", 200);
  if (!lender) return { error: "יש לכתוב ממי ההלוואה (בנק / גורם)." };
  if (amount === null) return { error: "סכום ההלוואה לא תקין." };
  if (monthlyPayment === null) return { error: "יש להזין החזר חודשי חיובי." };
  if (!firstPayment) return { error: "יש לבחור תאריך תשלום ראשון." };
  if (!Number.isInteger(payments) || payments < 1 || payments > 600) return { error: "מספר התשלומים חייב להיות בין 1 ל-600." };
  updateStore((s) => {
    s.loans.push({ id: newId(), lender, amount, monthlyPayment, firstPayment, payments, note: note || undefined, createdAt: new Date().toISOString() });
  });
  return done();
}

export async function deleteLoan(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  updateStore((s) => {
    s.loans = s.loans.filter((l) => l.id !== id);
  }, { beforeDelete: true });
}

// ---------- Client orders ----------
export async function addOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const client = text(fd, "client", 80);
  const date = parseDate(fd.get("date"));
  const amount = parseAmount(fd.get("amount"));
  const paid = fd.get("paid") === "on";
  const note = text(fd, "note", 200);
  if (!client) return { error: "יש לכתוב שם לקוח." };
  if (!date) return { error: "יש לבחור תאריך הזמנה." };
  if (amount === null) return { error: "יש להזין סכום הזמנה חיובי." };
  updateStore((s) => {
    s.orders.push({ id: newId(), client, date, amount, paidDate: paid ? date : undefined, note: note || undefined, createdAt: new Date().toISOString() });
  });
  return done();
}

export async function setOrderPaid(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const paid = fd.get("paid") === "1";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  updateStore((s) => {
    const o = s.orders.find((x) => x.id === id);
    if (o) o.paidDate = paid ? (today < o.date ? o.date : today) : undefined;
  });
}

export async function deleteOrder(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  updateStore((s) => {
    s.orders = s.orders.filter((o) => o.id !== id);
  }, { beforeDelete: true });
}
