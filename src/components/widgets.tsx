import Link from "next/link";
import {
  ArrowDown, ArrowUp, Building2, Car, ChartColumn, CircleMinus, CirclePlus, Coins, Ellipsis, Megaphone,
  Banknote, Landmark, Monitor, Percent, ReceiptText, Truck, Users, UsersRound,
} from "lucide-react";
import type { Summary } from "@/lib/data";
import { formatILS, formatPercent, formatSignedPercent } from "@/lib/format";
import { TONE_HEX } from "@/lib/tones";
import { Empty } from "./empty";

export { Empty };

function Change({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value === null) return <span className="kpi-change none">—</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`kpi-change ${good ? "up-good" : "up-bad"}`}>
      <Icon size={15} strokeWidth={2.6} aria-hidden />
      <span className="num" dir="ltr">{formatSignedPercent(value)}</span>
    </span>
  );
}

export function SummaryCards({ s }: { s: Summary }) {
  const cards = [
    { key: "income", label: "ברוטו החודש (הכנסות)", value: s.totals.income, change: s.changes.income, goodWhenUp: true, icon: ChartColumn, tone: "green" },
    { key: "expense", label: "הוצאות החודש", value: s.totals.expenses, change: s.changes.expenses, goodWhenUp: false, icon: ReceiptText, tone: "red" },
    { key: "profit", label: "נטו החודש (אחרי הוצאות)", value: s.totals.profit, change: s.changes.profit, goodWhenUp: true, icon: Coins, tone: s.totals.profit < 0 ? "red" : "green" },
  ] as const;
  return (
    <section className="kpis" aria-label={`סיכום ${s.label}`}>
      {cards.map((c) => (
        <article key={c.key} className={`card kpi ${c.key}`}>
          <div style={{ zIndex: 1 }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value num">{formatILS(c.value)}</div>
            <Change value={c.change} goodWhenUp={c.goodWhenUp} />
            <span className="kpi-sub">{s.hasPrev ? "לעומת החודש הקודם" : "אין נתונים לחודש הקודם"}</span>
          </div>
          <span className={`kpi-icon ${c.tone}`} aria-hidden>
            <c.icon size={28} />
          </span>
        </article>
      ))}
    </section>
  );
}

export function GettingStarted({ month }: { month: string }) {
  const q = `?month=${month}`;
  return (
    <section className="card getting-started">
      <div>
        <h2>אין עדיין נתונים לחודש הזה</h2>
        <p className="muted">רשמו מכירות של הסוכנים (הן נספרות כהכנסות), הוסיפו הוצאות, וכל הכרטיסים והגרפים יתעדכנו אוטומטית.</p>
      </div>
      <div className="gs-actions">
        <Link className="btn-primary" href={`/dashboard/employees${q}`}><Users size={16} aria-hidden /> רישום מכירות</Link>
        <Link className="btn-secondary" href={`/dashboard/expenses${q}`}><CircleMinus size={16} aria-hidden /> הוספת הוצאה</Link>
        <Link className="btn-secondary" href={`/dashboard/clients${q}`}><UsersRound size={16} aria-hidden /> הזמנות לקוחות</Link>
        <Link className="btn-secondary" href={`/dashboard/income${q}`}><CirclePlus size={16} aria-hidden /> הכנסה אחרת</Link>
      </div>
    </section>
  );
}

export function IncomeBySource({ s }: { s: Summary }) {
  const max = Math.max(0, ...s.incomeSources.map((x) => x.amount));
  return (
    <section className="card" aria-labelledby="src-t">
      <div className="card-head">
        <h2 id="src-t">הכנסות לפי מקור</h2>
        <span className="select-btn" style={{ cursor: "default" }}>{s.label}</span>
      </div>
      {s.incomeSources.length === 0 ? (
        <Empty text="עדיין לא נרשמו מכירות או הכנסות החודש." href={`/dashboard/employees?month=${s.month}`} cta="רישום מכירה" />
      ) : (
        <ul className="bar-list">
          {s.incomeSources.map((x) => (
            <li key={x.name}>
              <span>{x.name}</span>
              <span className="bar-track" aria-hidden>
                <span className={`bar-fill tone-${x.tone}`} style={{ width: `${(x.amount / max) * 100}%`, display: "block" }} />
              </span>
              <span className="amount num">{formatILS(x.amount)}</span>
              <span className="pct num">{formatPercent(x.amount / s.totals.income)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const CAT_ICONS = { megaphone: Megaphone, users: Users, percent: Percent, building: Building2, monitor: Monitor, car: Car, truck: Truck, bank: Landmark, more: Ellipsis } as const;

export function ExpenseByCategory({ s }: { s: Summary }) {
  return (
    <section className="card" aria-labelledby="cat-t">
      <div className="card-head">
        <h2 id="cat-t">הוצאות לפי קטגוריה</h2>
        <span className="select-btn" style={{ cursor: "default" }}>{s.label}</span>
      </div>
      {s.expenseCategories.length === 0 ? (
        <Empty text="עדיין לא הוזנו הוצאות החודש." href={`/dashboard/expenses?month=${s.month}`} cta="הוספת הוצאה" />
      ) : (
        <ul className="cat-list">
          {s.expenseCategories.map((c) => {
            const Icon = CAT_ICONS[c.icon];
            const hex = TONE_HEX[c.tone];
            return (
              <li key={c.name}>
                <span className="cat-icon" style={{ background: `${hex}1f`, color: hex }} aria-hidden>
                  <Icon size={16} />
                </span>
                <span>{c.name}</span>
                <span className="amount num">{formatILS(c.amount)}</span>
                <span className="pct num">{formatPercent(c.amount / s.totals.expenses)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function EmployeesTable({ s }: { s: Summary }) {
  return (
    <section className="card" aria-labelledby="emp-t">
      <div className="card-head">
        <h2 id="emp-t">כמה כל נציג הכניס</h2>
        <Link className="link-btn" href={`/dashboard/employees?month=${s.month}`}>ניהול נציגים</Link>
      </div>
      {s.employees.length === 0 ? (
        <Empty text="עדיין לא נוספו נציגים." href={`/dashboard/employees?month=${s.month}`} cta="הוספת נציג" />
      ) : (
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr><th>נציג</th><th>מכירות / יעד</th><th>עמלה לתשלום</th><th>עמידה ביעד</th></tr>
            </thead>
            <tbody>
              {s.employees.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td className="num">
                    <span>{formatILS(e.sales)}</span> {e.target > 0 && <span className="muted">/ {formatILS(e.target)}</span>}
                  </td>
                  <td className="num">{formatILS(e.commission)} <small className="muted">({e.commissionRate}%)</small></td>
                  <td><Progress value={e.progress} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function Progress({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">ללא יעד</span>;
  const color = value >= 1 ? "#16a34a" : value >= 0.8 ? "#d9932a" : "#f0567a";
  return (
    <div className="progress">
      <span className="progress-track" aria-hidden>
        <span className="progress-fill" style={{ width: `${Math.min(value, 1) * 100}%`, background: color, display: "block" }} />
      </span>
      <small className="num">{formatPercent(value)}</small>
    </div>
  );
}

export function MonthStats({ s }: { s: Summary }) {
  const q = `?month=${s.month}`;
  const o = s.orders;
  const items = [
    {
      href: `/dashboard/clients${q}`, icon: UsersRound, tone: "blue",
      label: "לקוחות ששילמו החודש",
      value: o.clients === 0 ? "—" : `${o.paidClients} מתוך ${o.clients}`,
      sub: o.clients === 0 ? "אין הזמנות החודש" : o.openAmount > 0 ? `פתוח לגבייה: ${formatILS(o.openAmount)}` : "כל ההזמנות שולמו",
    },
    { href: `/dashboard/salaries${q}`, icon: Banknote, tone: "purple", label: "משכורות החודש", value: formatILS(s.salaries), sub: "נכלל בהוצאות" },
    { href: `/dashboard/loans${q}`, icon: Landmark, tone: "amber", label: "החזרי הלוואות החודש", value: formatILS(s.loanPayments), sub: "נכלל בהוצאות" },
  ] as const;
  return (
    <section className="mini-kpis" aria-label="נתונים נוספים לחודש">
      {items.map((it) => (
        <Link key={it.label} href={it.href} className="card mini-kpi">
          <span className="mini-icon" style={{ background: `${TONE_HEX[it.tone]}1f`, color: TONE_HEX[it.tone] }} aria-hidden><it.icon size={20} /></span>
          <span>
            <span className="mini-label">{it.label}</span>
            <strong className="mini-value num">{it.value}</strong>
            <small className="muted">{it.sub}</small>
          </span>
        </Link>
      ))}
    </section>
  );
}
