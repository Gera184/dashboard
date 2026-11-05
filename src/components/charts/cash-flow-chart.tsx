"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact } from "@/lib/format";
import { ChartTooltip } from "./tooltip";

type Row = { month: string; income: number; expenses: number };

export function CashFlowChart({ data }: { data: Row[] }) {
  const empty = data.every((d) => d.income === 0 && d.expenses === 0);
  return (
    <section className="card" aria-labelledby="cf-t">
      <div className="card-head">
        <h2 id="cf-t">הכנסות לאורך זמן</h2>
        <span className="select-btn" style={{ cursor: "default" }}>12 חודשים אחרונים</span>
      </div>
      {empty ? (
        <div className="empty" style={{ minHeight: 210 }}><p>אין עדיין נתונים ב-12 החודשים האחרונים.</p></div>
      ) : (
      <>
      <div className="chart-box" style={{ height: 260 }} role="img" aria-label={`הכנסות והוצאות לפי חודש, ${data[0]?.month} עד ${data[data.length - 1]?.month}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="22%" margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="#eef1f6" vertical={false} />
            <XAxis dataKey="month" reversed interval="preserveStartEnd" minTickGap={8} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 12 }} tickMargin={8} />
            <YAxis orientation="right" domain={[0, "auto"]} tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
            <Bar dataKey="income" name="הכנסות" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="expenses" name="הוצאות" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="legend" style={{ marginTop: 8 }}>
        <span><i className="sw sq tone-income" />הכנסות</span>
        <span><i className="sw sq tone-expense" />הוצאות</span>
      </div>
      </>
      )}
    </section>
  );
}
