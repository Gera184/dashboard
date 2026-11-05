import Link from "next/link";
import { readStore } from "@/lib/store";
import { categorySuggestions, defaultDateFor, formatDate, monthLabel, plainEntriesFor } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { DeleteButton, EntryForm } from "@/components/forms";
import { Empty } from "@/components/empty";
import { deleteEntry } from "./actions";

/** Shared page body for /dashboard/income and /dashboard/expenses. Callers must run requireSession() first. */
export async function EntriesPage({ type, month }: { type: "income" | "expense"; month: string }) {
  const store = await readStore();
  const list = plainEntriesFor(store, month, type);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const isIncome = type === "income";
  return (
    <>
      <section className="card" aria-labelledby="add-t">
        <div className="card-head">
          <h2 id="add-t">{isIncome ? "הוספת הכנסה אחרת" : "הוספת הוצאה"}</h2>
          {!isIncome && <span className="muted">משכורות נרשמות בעמוד <Link href={`/dashboard/salaries?month=${month}`} className="inline-link">משכורות</Link>, והחזרי הלוואות מחושבים אוטומטית מעמוד <Link href={`/dashboard/loans?month=${month}`} className="inline-link">הלוואות</Link></span>}
          {isIncome && <span className="muted">מכירות של סוכנים נרשמות בעמוד <Link href={`/dashboard/employees?month=${month}`} className="inline-link">עובדים ועמלות</Link> ונספרות כהכנסה אוטומטית</span>}
        </div>
        <EntryForm type={type} categories={categorySuggestions(store, type)} defaultDate={defaultDateFor(month)} />
      </section>

      <section className="card" aria-labelledby="list-t">
        <div className="card-head">
          <h2 id="list-t">{isIncome ? "הכנסות נוספות" : "הוצאות"} ב{monthLabel(month)}</h2>
          <span className={`total-pill ${type}`}>סה״כ <strong className="num">{formatILS(total)}</strong></span>
        </div>
        {list.length === 0 ? (
          <Empty text={isIncome ? "אין הכנסות נוספות בחודש הזה (מלבד מכירות הסוכנים)." : "אין הוצאות בחודש הזה. הוסיפו את הראשונה בטופס למעלה."} />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>תאריך</th><th>{isIncome ? "מקור" : "קטגוריה"}</th><th className="end">סכום</th><th>הערה</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="num">{formatDate(e.date)}</td>
                    <td style={{ fontWeight: 600 }}>{e.category}</td>
                    <td className="num end">{formatILS(e.amount)}</td>
                    <td className="wrap muted">{e.note}</td>
                    <td className="end">
                      <DeleteButton action={deleteEntry} id={e.id} confirmText={`למחוק את הרשומה "${e.category}" על סך ${formatILS(e.amount)}?`} label="מחיקת רשומה" />
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
