"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cashFlow } from "@/lib/data";
import { formatCompact } from "@/lib/format";
import { ChartTooltip } from "./tooltip";

export function CashFlowChart() {
  return (
    <section className="card" aria-labelledby="cf-t">
      <div className="card-head">
        <h2 id="cf-t">תזרים מזומנים</h2>
        <span className="select-btn" style={{ cursor: "default" }}>3 חודשים אחרונים</span>
      </div>
      <div className="chart-box" style={{ height: 210 }} role="img" aria-label="תזרים מזומנים לשלושה חודשים: אוגוסט, ספטמבר ואוקטובר 2026">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cashFlow} barGap={4} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="#eef1f6" vertical={false} />
            <XAxis dataKey="month" reversed tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 12 }} tickMargin={8} />
            <YAxis orientation="right" domain={[0, 160000]} ticks={[0, 40000, 80000, 120000, 160000]} tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={44} />
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
    </section>
  );
}
