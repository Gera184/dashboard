"use client";

import { useMonthData } from "@/lib/use-month-data";
import { Loading } from "@/components/loading";
import { defaultDateFor, formatDate, monthLabel, SALARY_CATEGORY, salariesFor } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { DeleteButton, SalaryForm } from "@/components/forms";
import { Empty } from "@/components/empty";
import { deleteEntry } from "@/lib/actions";

export function SalariesView() {
  const { store, month } = useMonthData();
  if (!store) return <Loading />;
  const list = salariesFor(store, month);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const people = [...new Set([...store.employees.map((e) => e.name), ...store.entries.filter((e) => e.category === SALARY_CATEGORY && e.person).map((e) => e.person!)])];
  return (
    <>
      <section className="card" aria-labelledby="sal-add-t">
        <div className="card-head">
          <h2 id="sal-add-t">הוספת משכורת</h2>
          <span className="muted">משכורות נספרות כהוצאה בדשבורד</span>
        </div>
        <SalaryForm people={people} defaultDate={defaultDateFor(month)} />
      </section>
      <section className="card" aria-labelledby="sal-list-t">
        <div className="card-head">
          <h2 id="sal-list-t">משכורות ב{monthLabel(month)}</h2>
          <span className="total-pill expense">סה״כ <strong className="num">{formatILS(total)}</strong></span>
        </div>
        {list.length === 0 ? (
          <Empty text="אין משכורות רשומות בחודש הזה." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>תאריך</th><th>עובד</th><th className="end">סכום</th><th>הערה</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="num">{formatDate(e.date)}</td>
                    <td style={{ fontWeight: 600 }}>{e.person ?? "—"}</td>
                    <td className="num end">{formatILS(e.amount)}</td>
                    <td className="wrap muted">{e.note}</td>
                    <td className="end"><DeleteButton action={deleteEntry} id={e.id} confirmText={`למחוק את המשכורת של ${e.person ?? ""} על סך ${formatILS(e.amount)}?`} label="מחיקת משכורת" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
