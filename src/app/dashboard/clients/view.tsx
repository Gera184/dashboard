"use client";

import { useMonthData } from "@/lib/use-month-data";
import { Loading } from "@/components/loading";
import { defaultDateFor, formatDate, monthLabel, orderStats, ordersFor } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { DeleteButton, OrderForm, PaidToggle } from "@/components/forms";
import { Empty } from "@/components/empty";
import { deleteOrder } from "@/lib/actions";

export function ClientsView() {
  const { store, month } = useMonthData();
  if (!store) return <Loading />;
  const list = ordersFor(store, month);
  const st = orderStats(store, month);
  const clients = [...new Set(store.orders.map((o) => o.client))].sort((a, b) => a.localeCompare(b, "he"));
  return (
    <>
      <section className="card" aria-labelledby="ord-add-t">
        <div className="card-head">
          <h2 id="ord-add-t">הוספת הזמנה</h2>
          <span className="muted">סמנו &quot;שולם&quot; כשהלקוח משלם, והדשבורד יראה כמה לקוחות שילמו החודש</span>
        </div>
        <OrderForm clients={clients} defaultDate={defaultDateFor(month)} />
      </section>
      <section className="card" aria-labelledby="ord-list-t">
        <div className="card-head">
          <h2 id="ord-list-t">הזמנות ותשלומים ב{monthLabel(month)}</h2>
          <div className="pills">
            <span className="total-pill income">שילמו <strong className="num">{st.paidClients} מתוך {st.clients}</strong> לקוחות</span>
            <span className="total-pill income">שולם <strong className="num">{formatILS(st.paidAmount)}</strong></span>
            <span className="total-pill expense">פתוח <strong className="num">{formatILS(st.openAmount)}</strong></span>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty text="אין הזמנות פתוחות או תשלומים בחודש הזה." />
        ) : (
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr><th>תאריך הזמנה</th><th>לקוח</th><th className="end">סכום</th><th>סטטוס</th><th>הערה</th><th><span className="visually-hidden">פעולות</span></th></tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id}>
                    <td className="num">{formatDate(o.date)}</td>
                    <td style={{ fontWeight: 600 }}>{o.client}</td>
                    <td className="num end">{formatILS(o.amount)}</td>
                    <td>
                      <PaidToggle id={o.id} paid={!!o.paidDate} />
                      {o.paidDate && <small className="muted num"> {formatDate(o.paidDate)}</small>}
                    </td>
                    <td className="wrap muted">{o.note}</td>
                    <td className="end"><DeleteButton action={deleteOrder} id={o.id} confirmText={`למחוק את ההזמנה של ${o.client}?`} label="מחיקת הזמנה" /></td>
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
