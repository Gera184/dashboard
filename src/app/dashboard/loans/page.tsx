import { requireSession } from "@/lib/auth/session";
import { readStore } from "@/lib/store";
import { defaultDateFor, formatDate, loanRows, monthLabel, resolveMonth } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { DeleteButton, LoanForm } from "@/components/forms";
import { Empty } from "@/components/empty";
import { deleteLoan } from "../actions";

export default async function LoansPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  await requireSession();
  const month = resolveMonth((await searchParams).month);
  const rows = loanRows(await readStore(), month);
  const due = rows.filter((r) => r.dueThisMonth).reduce((s, r) => s + r.monthlyPayment, 0);
  const left = rows.reduce((s, r) => s + r.remainingAmount, 0);
  return (
    <>
      <section className="card" aria-labelledby="loan-add-t">
        <div className="card-head">
          <h2 id="loan-add-t">הוספת הלוואה</h2>
          <span className="muted">ההחזר החודשי נרשם אוטומטית כהוצאה בכל חודש עד סוף ההלוואה</span>
        </div>
        <LoanForm defaultDate={defaultDateFor(month)} />
      </section>
      <section className="card" aria-labelledby="loan-list-t">
        <div className="card-head">
          <h2 id="loan-list-t">הלוואות ({monthLabel(month)})</h2>
          <div className="pills">
            <span className="total-pill expense">החזר החודש <strong className="num">{formatILS(due)}</strong></span>
            <span className="total-pill">יתרה לתשלום <strong className="num">{formatILS(left)}</strong></span>
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty text="אין הלוואות רשומות." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>ממי</th><th>סכום ההלוואה</th><th>החזר חודשי</th><th>תשלומים</th><th>יתרה לתשלום</th><th>תקופה</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.lender}{r.note && <small className="muted"> · {r.note}</small>}</td>
                    <td className="num">{formatILS(r.amount)}</td>
                    <td className="num">{formatILS(r.monthlyPayment)}</td>
                    <td className="num">{r.paid}/{r.payments}</td>
                    <td className="num">{formatILS(r.remainingAmount)}</td>
                    <td className="num muted">{formatDate(r.firstPayment)} – {r.endMonth.slice(5)}/{r.endMonth.slice(0, 4)}</td>
                    <td className="end"><DeleteButton action={deleteLoan} id={r.id} confirmText={`למחוק את ההלוואה מ${r.lender}? ההחזרים יוסרו מכל החודשים.`} label="מחיקת הלוואה" /></td>
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
