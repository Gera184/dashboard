"use client";

import { useMonthData } from "@/lib/use-month-data";
import { Loading } from "@/components/loading";
import { defaultDateFor, employeeRows, formatDate, monthLabel, salesFor } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { ArchiveToggle, DeleteButton, EmployeeForm, EmployeeSettings, SaleForm } from "@/components/forms";
import { Empty } from "@/components/empty";
import { Progress } from "@/components/widgets";
import { deleteEmployee, deleteSale } from "@/lib/actions";

export function EmployeesView() {
  const { store, month } = useMonthData();
  if (!store) return <Loading />;
  const rows = employeeRows(store, month, { includeArchived: true }).sort((a, b) => Number(!!a.archived) - Number(!!b.archived));
  const active = rows.filter((r) => !r.archived);
  const hasAnySales = new Set(store.sales.map((x) => x.employeeId));
  const sales = salesFor(store, month);
  const names = new Map(store.employees.map((e) => [e.id, e.name]));
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);

  return (
    <>
      <section className="card" aria-labelledby="emp-add-t">
        <div className="card-head"><h2 id="emp-add-t">הוספת נציג</h2></div>
        <EmployeeForm />
      </section>

      <section className="card" aria-labelledby="sale-add-t">
        <div className="card-head">
          <h2 id="sale-add-t">רישום מכירה</h2>
          <span className="muted">כל מכירה נספרת כהכנסה בדשבורד, והעמלה מחושבת לפי אחוז העמלה של הנציג</span>
        </div>
        {active.length === 0 ? <Empty text="קודם הוסיפו נציג, ואז אפשר לרשום לו מכירות." /> : <SaleForm employees={active.map((r) => ({ id: r.id, name: r.name }))} defaultDate={defaultDateFor(month)} />}
      </section>

      <section className="card" aria-labelledby="emp-list-t">
        <div className="card-head">
          <h2 id="emp-list-t">נציגים ועמלות ב{monthLabel(month)}</h2>
          <span className="total-pill expense">סה״כ עמלות <strong className="num">{formatILS(totalCommission)}</strong></span>
        </div>
        {rows.length === 0 ? (
          <Empty text="עדיין לא נוספו נציגים." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>נציג</th><th>מכירות החודש</th><th>עמלה</th><th>עמידה ביעד</th><th>יעד חודשי (₪) · עמלה (%)</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.archived ? "archived" : undefined}>
                    <td style={{ fontWeight: 600 }}>{r.name}{r.archived && <small className="muted"> · בארכיון</small>}</td>
                    <td className="num">{formatILS(r.sales)}</td>
                    <td className="num">{formatILS(r.commission)}</td>
                    <td><Progress value={r.progress} /></td>
                    <td><EmployeeSettings key={`${r.target}-${r.commissionRate}`} id={r.id} target={r.target} commissionRate={r.commissionRate} /></td>
                    <td className="end">
                      {hasAnySales.has(r.id) ? (
                        // Deleting would remove their sales from past months' income, so only archiving is offered.
                        <ArchiveToggle id={r.id} archived={!!r.archived} name={r.name} />
                      ) : (
                        <DeleteButton action={deleteEmployee} id={r.id} confirmText={`למחוק את ${r.name}?`} label={`מחיקת ${r.name}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" aria-labelledby="sales-t">
        <div className="card-head"><h2 id="sales-t">מכירות ב{monthLabel(month)}</h2></div>
        {sales.length === 0 ? (
          <Empty text="אין מכירות רשומות בחודש הזה." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>תאריך</th><th>נציג</th><th className="end">סכום</th><th>הערה</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {sales.map((x) => (
                  <tr key={x.id}>
                    <td className="num">{formatDate(x.date)}</td>
                    <td style={{ fontWeight: 600 }}>{names.get(x.employeeId)}</td>
                    <td className="num end">{formatILS(x.amount)}</td>
                    <td className="wrap muted">{x.note}</td>
                    <td className="end">
                      <DeleteButton action={deleteSale} id={x.id} confirmText={`למחוק את המכירה על סך ${formatILS(x.amount)}?`} label="מחיקת מכירה" />
                    </td>
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
