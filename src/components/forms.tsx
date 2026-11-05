"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Archive, ArchiveRestore, Check, Plus, Trash2 } from "lucide-react";
import { addEmployee, addEntry, addLoan, addOrder, addSale, setEmployeeArchived, setOrderPaid, updateEmployee, type FormState } from "@/app/dashboard/actions";

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
        <span>שם הנציג</span>
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
        {pending ? "שומר…" : "הוספת נציג"}
      </button>
      <div className="form-status"><Status state={state} okText="הנציג נוסף" /></div>
    </form>
  );
}

export function SaleForm({ employees, defaultDate }: { employees: { id: string; name: string }[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addSale, undefined);
  return (
    <form action={action} className="entry-form">
      <label className="field">
        <span>נציג</span>
        <select name="employeeId" required defaultValue="">
          <option value="" disabled>בחירת נציג</option>
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

export function SalaryForm({ people, defaultDate }: { people: string[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addEntry, undefined);
  const id = useId();
  return (
    <form action={action} className="entry-form">
      <input type="hidden" name="type" value="expense" />
      <input type="hidden" name="category" value="משכורות" />
      <label className="field">
        <span>עובד</span>
        <input name="person" list={`${id}-people`} required maxLength={60} autoComplete="off" placeholder="שם העובד" />
        <datalist id={`${id}-people`}>{people.map((p) => <option key={p} value={p} />)}</datalist>
      </label>
      <label className="field">
        <span>תאריך תשלום</span>
        <input name="date" type="date" required defaultValue={defaultDate} />
      </label>
      <label className="field">
        <span>עלות המשכורת (₪)</span>
        <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required dir="ltr" placeholder="0" />
      </label>
      <label className="field grow">
        <span>הערה <small className="muted">(לא חובה)</small></span>
        <input name="note" maxLength={200} placeholder="לדוגמה: כולל בונוס" />
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : "הוספת משכורת"}
      </button>
      <div className="form-status"><Status state={state} okText="המשכורת נשמרה" /></div>
    </form>
  );
}

export function LoanForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addLoan, undefined);
  return (
    <form action={action} className="entry-form">
      <label className="field">
        <span>ממי ההלוואה</span>
        <input name="lender" required maxLength={60} autoComplete="off" placeholder="לדוגמה: בנק הפועלים" />
      </label>
      <label className="field">
        <span>סכום ההלוואה (₪)</span>
        <input name="amount" type="number" inputMode="decimal" min="0" step="0.01" required dir="ltr" placeholder="0" />
      </label>
      <label className="field">
        <span>החזר חודשי (₪)</span>
        <input name="monthlyPayment" type="number" inputMode="decimal" min="0.01" step="0.01" required dir="ltr" placeholder="0" />
      </label>
      <label className="field">
        <span>מספר תשלומים</span>
        <input name="payments" type="number" inputMode="numeric" min="1" max="600" step="1" required dir="ltr" placeholder="12" />
      </label>
      <label className="field">
        <span>תשלום ראשון</span>
        <input name="firstPayment" type="date" required defaultValue={defaultDate} />
      </label>
      <label className="field grow">
        <span>הערה <small className="muted">(לא חובה)</small></span>
        <input name="note" maxLength={200} />
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : "הוספת הלוואה"}
      </button>
      <div className="form-status"><Status state={state} okText="ההלוואה נשמרה" /></div>
    </form>
  );
}

export function OrderForm({ clients, defaultDate }: { clients: string[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addOrder, undefined);
  const id = useId();
  return (
    <form action={action} className="entry-form">
      <label className="field">
        <span>לקוח</span>
        <input name="client" list={`${id}-clients`} required maxLength={80} autoComplete="off" placeholder="שם הלקוח" />
        <datalist id={`${id}-clients`}>{clients.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="field">
        <span>תאריך הזמנה</span>
        <input name="date" type="date" required defaultValue={defaultDate} />
      </label>
      <label className="field">
        <span>סכום (₪)</span>
        <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required dir="ltr" placeholder="0" />
      </label>
      <label className="field grow">
        <span>הערה <small className="muted">(לא חובה)</small></span>
        <input name="note" maxLength={200} placeholder="לדוגמה: מספר הזמנה" />
      </label>
      <label className="check">
        <input type="checkbox" name="paid" />
        <span>כבר שולם</span>
      </label>
      <button className="btn-primary" type="submit" disabled={pending}>
        <Plus size={16} aria-hidden />
        {pending ? "שומר…" : "הוספת הזמנה"}
      </button>
      <div className="form-status"><Status state={state} okText="ההזמנה נשמרה" /></div>
    </form>
  );
}

export function PaidToggle({ id, paid }: { id: string; paid: boolean }) {
  return (
    <form action={setOrderPaid}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paid" value={paid ? "0" : "1"} />
      <button type="submit" className={paid ? "status-pill paid" : "status-pill open"} title={paid ? "לחצו כדי לסמן כלא שולם" : "לחצו כדי לסמן כשולם"}>
        {paid ? <><Check size={14} aria-hidden /> שולם</> : "לא שולם · סמן כשולם"}
      </button>
    </form>
  );
}

/** Archive an agent who left (keeps their sales in past months) or bring them back. */
export function ArchiveToggle({ id, archived, name }: { id: string; archived: boolean; name: string }) {
  const label = archived ? `החזרת ${name} לפעילות` : `העברת ${name} לארכיון`;
  return (
    <form
      action={setEmployeeArchived}
      onSubmit={(e) => { if (!archived && !confirm(`להעביר את ${name} לארכיון? המכירות שלו/ה יישארו בכל החודשים, והוא/היא לא יופיעו יותר בטופס המכירות.`)) e.preventDefault(); }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="archived" value={archived ? "0" : "1"} />
      <button type="submit" className="icon-btn" aria-label={label} title={label}>
        {archived ? <ArchiveRestore size={16} aria-hidden /> : <Archive size={16} aria-hidden />}
      </button>
    </form>
  );
}
