import { requireSession } from "@/lib/auth/session";
import { readStore } from "@/lib/store";
import { defaultDateFor, employeeRows, formatDate, monthLabel, resolveMonth, salesFor } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { DeleteButton, EmployeeForm, EmployeeSettings, SaleForm } from "@/components/forms";
import { Empty } from "@/components/empty";
import { Progress } from "@/components/widgets";
import { deleteEmployee, deleteSale } from "../actions";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  await requireSession();
  const month = resolveMonth((await searchParams).month);
  const store = await readStore();
  const rows = employeeRows(store, month);
  const sales = salesFor(store, month);
  const names = new Map(store.employees.map((e) => [e.id, e.name]));
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);

  return (
    <>
      <section className="card" aria-labelledby="emp-add-t">
        <div className="card-head"><h2 id="emp-add-t">הוספת עובד</h2></div>
        <EmployeeForm />
      </section>

      <section className="card" aria-labelledby="sale-add-t">
        <div className="card-head">
          <h2 id="sale-add-t">רישום מכירה</h2>
          <span className="muted">כל מכירה נספרת כהכנסה בדשבורד, והעמלה מחושבת לפי אחוז העמלה של העובד</span>
        </div>
        {rows.length === 0 ? <Empty text="קודם הוסיפו עובד, ואז אפשר לרשום לו מכירות." /> : <SaleForm employees={rows.map((r) => ({ id: r.id, name: r.name }))} defaultDate={defaultDateFor(month)} />}
      </section>

      <section className="card" aria-labelledby="emp-list-t">
        <div className="card-head">
          <h2 id="emp-list-t">עובדים ועמלות ב{monthLabel(month)}</h2>
          <span className="total-pill expense">סה״כ עמלות <strong className="num">{formatILS(totalCommission)}</strong></span>
        </div>
        {rows.length === 0 ? (
          <Empty text="עדיין לא נוספו עובדים." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>עובד</th><th>מכירות החודש</th><th>עמלה</th><th>עמידה ביעד</th><th>יעד חודשי (₪) · עמלה (%)</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td className="num">{formatILS(r.sales)}</td>
                    <td className="num">{formatILS(r.commission)}</td>
                    <td><Progress value={r.progress} /></td>
                    <td><EmployeeSettings key={`${r.target}-${r.commissionRate}`} id={r.id} target={r.target} commissionRate={r.commissionRate} /></td>
                    <td className="end">
                      <DeleteButton action={deleteEmployee} id={r.id} confirmText={`למחוק את ${r.name} ואת כל המכירות שלו/ה?`} label={`מחיקת ${r.name}`} />
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
                <tr><th>תאריך</th><th>עובד</th><th className="end">סכום</th><th>הערה</th><th><span className="visually-hidden">פעולות</span></th></tr>
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
