"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { newId, updateStore, type EntryType } from "@/lib/store";

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

const done = (): FormState => {
  revalidatePath("/dashboard", "layout");
  return { ok: true, nonce: Date.now() };
};

// ---------- Income / expense entries ----------
export async function addEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const type = fd.get("type") as EntryType;
  if (type !== "income" && type !== "expense") return { error: "סוג רשומה לא תקין." };
  const date = parseDate(fd.get("date"));
  const category = text(fd, "category", 60);
  const amount = parseAmount(fd.get("amount"));
  const note = text(fd, "note", 200);
  if (!date) return { error: "יש לבחור תאריך תקין." };
  if (!category) return { error: type === "income" ? "יש לבחור או לכתוב מקור הכנסה." : "יש לבחור או לכתוב קטגוריה." };
  if (amount === null) return { error: "יש להזין סכום חיובי (עד שתי ספרות אחרי הנקודה)." };

  await updateStore((s) => {
    s.entries.push({ id: newId(), type, date, category, amount, note: note || undefined, createdAt: new Date().toISOString() });
  });
  return done();
}

export async function deleteEntry(fd: FormData) {
  await requireSession();
  const id = String(fd.get("id") ?? "");
  await updateStore((s) => {
    s.entries = s.entries.filter((e) => e.id !== id);
  });
  revalidatePath("/dashboard", "layout");
}

// ---------- Employees ----------
export async function addEmployee(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const name = text(fd, "name", 60);
  const target = parseAmount(fd.get("target") || "0", { allowZero: true });
  const rate = parseAmount(fd.get("commissionRate") || "0", { allowZero: true });
  if (!name) return { error: "יש להזין שם עובד." };
  if (target === null) return { error: "יעד חודשי חייב להיות מספר (אפשר 0)." };
  if (rate === null || rate > 100) return { error: "אחוז עמלה חייב להיות בין 0 ל-100." };

  const dup = await updateStore((s) => {
    if (s.employees.some((e) => e.name === name)) return true;
    s.employees.push({ id: newId(), name, target, commissionRate: rate, createdAt: new Date().toISOString() });
    return false;
  });
  if (dup) return { error: "כבר קיים עובד בשם הזה." };
  return done();
}

export async function updateEmployee(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const id = String(fd.get("id") ?? "");
  const target = parseAmount(fd.get("target") || "0", { allowZero: true });
  const rate = parseAmount(fd.get("commissionRate") || "0", { allowZero: true });
  if (target === null) return { error: "יעד לא תקין." };
  if (rate === null || rate > 100) return { error: "אחוז עמלה לא תקין." };
  await updateStore((s) => {
    const e = s.employees.find((x) => x.id === id);
    if (e) Object.assign(e, { target, commissionRate: rate });
  });
  return done();
}

export async function deleteEmployee(fd: FormData) {
  await requireSession();
  const id = String(fd.get("id") ?? "");
  await updateStore((s) => {
    s.employees = s.employees.filter((e) => e.id !== id);
    s.sales = s.sales.filter((x) => x.employeeId !== id);
  });
  revalidatePath("/dashboard", "layout");
}

// ---------- Sales (drive commissions) ----------
export async function addSale(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const employeeId = String(fd.get("employeeId") ?? "");
  const date = parseDate(fd.get("date"));
  const amount = parseAmount(fd.get("amount"));
  const note = text(fd, "note", 200);
  if (!date) return { error: "יש לבחור תאריך תקין." };
  if (amount === null) return { error: "יש להזין סכום מכירה חיובי." };

  const ok = await updateStore((s) => {
    if (!s.employees.some((e) => e.id === employeeId)) return false;
    s.sales.push({ id: newId(), employeeId, date, amount, note: note || undefined, createdAt: new Date().toISOString() });
    return true;
  });
  if (!ok) return { error: "יש לבחור עובד." };
  return done();
}

export async function deleteSale(fd: FormData) {
  await requireSession();
  const id = String(fd.get("id") ?? "");
  await updateStore((s) => {
    s.sales = s.sales.filter((x) => x.id !== id);
  });
  revalidatePath("/dashboard", "layout");
}
