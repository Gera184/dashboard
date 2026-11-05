"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Slice } from "@/lib/data";
import { Empty } from "../empty";
import { formatILS, formatPercent } from "@/lib/format";
import { TONE_HEX } from "@/lib/tones";
import { ChartTooltip } from "./tooltip";

export function ExpenseDonut({ data, total, label, month }: { data: Slice[]; total: number; label: string; month: string }) {
  const expenseCategories = data;
  return (
    <section className="card" aria-labelledby="donut-t">
      <div className="card-head">
        <h2 id="donut-t">פילוח הוצאות</h2>
      </div>
      {data.length === 0 ? (
        <Empty text="כשתוסיפו הוצאות, הפילוח לפי קטגוריה יופיע כאן." href={`/dashboard/expenses?month=${month}`} cta="הוספת הוצאה" />
      ) : (
      <div className="donut-wrap">
        <table className="legend-table">
          <caption className="visually-hidden">פילוח הוצאות לפי קטגוריה, {label}</caption>
          <tbody>
            {expenseCategories.map((c) => (
              <tr key={c.name}>
                <td><span className="legend-name"><i className={`dot-sw tone-${c.tone}`} />{c.name}</span></td>
                <td className="num">{formatILS(c.amount)}</td>
                <td className="num">{formatPercent(c.amount / total)}</td>
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
            <strong className="num">{formatILS(total)}</strong>
            <span>סה״כ הוצאות</span>
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
