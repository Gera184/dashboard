import { ArrowDown, ArrowUp, Building2, ChartColumn, Coins, Ellipsis, Megaphone, Monitor, Percent, ReceiptText, Users } from "lucide-react";
import { changes, employees, expenseCategories, incomeSources, topClients, totals, transactions } from "@/lib/data";
import { formatILS, formatPercent, formatSignedPercent } from "@/lib/format";
import { TONE_HEX } from "@/lib/tones";

function Change({ value, goodWhenUp }: { value: number; goodWhenUp: boolean }) {
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

export function SummaryCards() {
  const cards = [
    { key: "income", label: "סה״כ הכנסות", value: totals.income, change: changes.income, goodWhenUp: true, icon: ChartColumn, tone: "green" },
    { key: "expense", label: "סה״כ הוצאות", value: totals.expenses, change: changes.expenses, goodWhenUp: false, icon: ReceiptText, tone: "red" },
    { key: "profit", label: "רווח נקי", value: totals.profit, change: changes.profit, goodWhenUp: true, icon: Coins, tone: "green" },
  ] as const;
  return (
    <section className="kpis" aria-label="סיכום החודש">
      {cards.map((c) => (
        <article key={c.key} className={`card kpi ${c.key}`}>
          <div style={{ zIndex: 1 }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value num">{formatILS(c.value)}</div>
            <Change value={c.change} goodWhenUp={c.goodWhenUp} />
            <span className="kpi-sub">לעומת החודש הקודם</span>
          </div>
          <span className={`kpi-icon ${c.tone}`} aria-hidden>
            <c.icon size={28} />
          </span>
        </article>
      ))}
    </section>
  );
}

export function IncomeBySource() {
  const max = Math.max(...incomeSources.map((s) => s.amount));
  return (
    <section className="card" aria-labelledby="src-t">
      <div className="card-head">
        <h2 id="src-t">הכנסות לפי מקור</h2>
        <span className="select-btn" style={{ cursor: "default" }}>החודש הנוכחי</span>
      </div>
      <ul className="bar-list">
        {incomeSources.map((s) => (
          <li key={s.name}>
            <span>{s.name}</span>
            <span className="bar-track" aria-hidden>
              <span className={`bar-fill tone-${s.tone}`} style={{ width: `${(s.amount / max) * 100}%`, display: "block" }} />
            </span>
            <span className="amount num">{formatILS(s.amount)}</span>
            <span className="pct num">{formatPercent(s.amount / totals.income)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const CAT_ICONS = { megaphone: Megaphone, users: Users, percent: Percent, building: Building2, monitor: Monitor, more: Ellipsis } as const;

export function ExpenseByCategory() {
  return (
    <section className="card" aria-labelledby="cat-t">
      <div className="card-head">
        <h2 id="cat-t">הוצאות לפי קטגוריה</h2>
        <span className="select-btn" style={{ cursor: "default" }}>החודש הנוכחי</span>
      </div>
      <ul className="cat-list">
        {expenseCategories.map((c) => {
          const Icon = CAT_ICONS[c.icon];
          const hex = TONE_HEX[c.tone];
          return (
            <li key={c.name}>
              <span className="cat-icon" style={{ background: `${hex}1f`, color: hex }} aria-hidden>
                <Icon size={16} />
              </span>
              <span>{c.name}</span>
              <span className="amount num">{formatILS(c.amount)}</span>
              <span className="pct num">{formatPercent(c.amount / totals.expenses)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RecentTransactions() {
  return (
    <section className="card" aria-labelledby="tx-t">
      <div className="card-head">
        <h2 id="tx-t">עסקאות אחרונות</h2>
        <button className="link-btn" type="button">הצג הכל</button>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr><th>תאריך</th><th>תיאור</th><th>סוג</th><th className="end">סכום</th></tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.date + t.description}>
                <td className="num">{t.date}</td>
                <td className="wrap">{t.description}</td>
                <td>{t.type}</td>
                <td className={`end num ${t.amount > 0 ? "pos" : "neg"}`}>
                  <span className="visually-hidden">{t.amount > 0 ? "זיכוי" : "חיוב"}</span>
                  {formatILS(Math.abs(t.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TopClients() {
  return (
    <section className="card" aria-labelledby="cl-t">
      <div className="card-head">
        <h2 id="cl-t">לקוחות מובילים</h2>
        <button className="link-btn" type="button">הצג הכל</button>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr><th>לקוח</th><th className="end">הכנסות החודש</th></tr>
          </thead>
          <tbody>
            {topClients.map((c) => (
              <tr key={c.name}>
                <td>
                  <span className="client-badge" style={{ background: TONE_HEX[c.tone] }} aria-hidden>{c.name[0]}</span>
                  {c.name}
                </td>
                <td className="end num" style={{ fontWeight: 600 }}>{formatILS(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EmployeesTable() {
  return (
    <section className="card" aria-labelledby="emp-t">
      <div className="card-head">
        <h2 id="emp-t">עובדים ועמלות</h2>
        <button className="link-btn" type="button">הצג הכל</button>
      </div>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr><th>עובד</th><th>עמלת החודש</th><th>מכירות / יעד</th><th>עמידה ביעד</th></tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const color = e.progress >= 1 ? "#16a34a" : e.progress >= 0.8 ? "#d9932a" : "#f0567a";
              return (
                <tr key={e.name}>
                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                  <td className="num">{formatILS(e.commission)}</td>
                  <td className="num"><span>{formatILS(e.sales)}</span> <span className="muted">/ {formatILS(e.target)}</span></td>
                  <td>
                    <div className="progress">
                      <span className="progress-track" aria-hidden>
                        <span className="progress-fill" style={{ width: `${Math.min(e.progress, 1) * 100}%`, background: color, display: "block" }} />
                      </span>
                      <small className="num">{formatPercent(e.progress)}</small>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
