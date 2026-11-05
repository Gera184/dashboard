"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { expenseCategories, totals } from "@/lib/data";
import { formatILS, formatPercent } from "@/lib/format";
import { TONE_HEX } from "@/lib/tones";
import { ChartTooltip } from "./tooltip";

export function ExpenseDonut() {
  return (
    <section className="card" aria-labelledby="donut-t">
      <div className="card-head">
        <h2 id="donut-t">פילוח הוצאות</h2>
      </div>
      <div className="donut-wrap">
        <table className="legend-table">
          <caption className="visually-hidden">פילוח הוצאות לפי קטגוריה, אוקטובר 2026</caption>
          <tbody>
            {expenseCategories.map((c) => (
              <tr key={c.name}>
                <td><span className="legend-name"><i className={`dot-sw tone-${c.tone}`} />{c.name}</span></td>
                <td className="num">{formatILS(c.amount)}</td>
                <td className="num">{formatPercent(c.amount / totals.expenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="donut" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[...expenseCategories]} dataKey="amount" nameKey="name" innerRadius="66%" outerRadius="100%" startAngle={90} endAngle={-270} paddingAngle={1.5} cornerRadius={4} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
                {expenseCategories.map((c) => <Cell key={c.name} fill={TONE_HEX[c.tone]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <strong className="num">{formatILS(totals.expenses)}</strong>
            <span>סה״כ הוצאות</span>
          </div>
        </div>
      </div>
    </section>
  );
}
