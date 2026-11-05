"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { addEmployee, addEntry, addSale, updateEmployee, type FormState } from "@/app/dashboard/actions";

function Status({ state, okText }: { state: FormState; okText: string }) {
  const [showOk, setShowOk] = useState(false);
  useEffect(() => {
    if (!state?.ok) return;
    setShowOk(true);
    const t = setTimeout(() => setShowOk(false), 2500);
    return () => clearTimeout(t);
  }, [state?.ok, state?.nonce]);
  if (state?.error) return <p className="form-error" role="alert">{state.error}</p>;
  if (showOk) return <p className="form-ok" role="status"><Check size={15} aria-hidden /> {okText}</p>;
  return null;
}

export function EntryForm({ type, categories, defaultDate }: { type: "income" | "expense"; categories: string[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addEntry, undefined);
  const id = useId();
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state?.ok) firstRef.current?.focus(); }, [state?.nonce, state?.ok]);
  const isIncome = type === "income";
  return (
    <form action={action} className="entry-form">
      <input type="hidden" name="type" value={type} />
      <label className="field">
        <span>תאריך</span>
        <input name="date" type="date" required defaultValue={defaultDate} />
      </label>
      <label className="field">
        <span>{isIncome ? "מקור הכנסה" : "קטגוריה"}</span>
        <input ref={firstRef} name="category" list={`${id}-cats`} required maxLength={60} placeholder={isIncome ? "לדוגמה: לקוחות חדשים" : "לדוגמה: פרסום ומדיה"} autoComplete="off" />
        <datalist id={`${id}-cats`}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="field">
        <span>סכום (₪)</span>
        <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" max="1000000000" required dir="ltr" placeholder="0" />
      </label>
      <label className="field grow">
        <span>הערה <small className="muted">(לא חובה)</small></span>
        <input name="note" maxLength={200} placeholder={isIncome ? "לדוגמה: שם הלקוח או מספר חשבונית" : "לדוגמה: שם הספק"} />
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : isIncome ? "הוספת הכנסה" : "הוספת הוצאה"}
      </button>
      <div className="form-status"><Status state={state} okText={isIncome ? "ההכנסה נשמרה" : "ההוצאה נשמרה"} /></div>
    </form>
  );
}

export function EmployeeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addEmployee, undefined);
  return (
    <form action={action} className="entry-form">
      <label className="field">
        <span>שם העובד</span>
        <input name="name" required maxLength={60} autoComplete="off" />
      </label>
      <label className="field">
        <span>יעד מכירות חודשי (₪)</span>
        <input name="target" type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" placeholder="0" />
      </label>
      <label className="field">
        <span>עמלה (%)</span>
        <input name="commissionRate" type="number" inputMode="decimal" min="0" max="100" step="0.01" dir="ltr" placeholder="0" />
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : "הוספת עובד"}
      </button>
      <div className="form-status"><Status state={state} okText="העובד נוסף" /></div>
    </form>
  );
}

export function SaleForm({ employees, defaultDate }: { employees: { id: string; name: string }[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSale, undefined);
  return (
    <form action={action} className="entry-form">
      <label className="field">
        <span>עובד</span>
        <select name="employeeId" required defaultValue="">
          <option value="" disabled>בחירת עובד</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>תאריך</span>
        <input name="date" type="date" required defaultValue={defaultDate} />
      </label>
      <label className="field">
        <span>סכום המכירה (₪)</span>
        <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required dir="ltr" placeholder="0" />
      </label>
      <label className="field grow">
        <span>הערה <small className="muted">(לא חובה)</small></span>
        <input name="note" maxLength={200} />
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : "הוספת מכירה"}
      </button>
      <div className="form-status"><Status state={state} okText="המכירה נשמרה" /></div>
    </form>
  );
}

export function EmployeeSettings({ id, target, commissionRate }: { id: string; target: number; commissionRate: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateEmployee, undefined);
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <label>
        <span className="visually-hidden">יעד חודשי</span>
        <input name="target" type="number" min="0" step="0.01" dir="ltr" defaultValue={target} aria-label="יעד חודשי (₪)" />
      </label>
      <label>
        <span className="visually-hidden">עמלה</span>
        <input name="commissionRate" type="number" min="0" max="100" step="0.01" dir="ltr" defaultValue={commissionRate} aria-label="עמלה (%)" className="short" />
        <span className="muted">%</span>
      </label>
      <button type="submit" className="link-btn" disabled={pending}>{state?.ok && !pending ? "נשמר" : "שמירה"}</button>
      {state?.error && <small className="err" role="alert">{state.error}</small>}
    </form>
  );
}

export function DeleteButton({ action, id, confirmText, label = "מחיקה" }: { action: (fd: FormData) => Promise<void>; id: string; confirmText: string; label?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(confirmText)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="icon-btn danger" aria-label={label} title={label}>
        <Trash2 size={16} aria-hidden />
      </button>
    </form>
  );
}
