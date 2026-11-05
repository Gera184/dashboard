"use client";

import { useId, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point } from "@/lib/data";
import { formatILS } from "@/lib/format";
import { formatCompact } from "@/lib/format";
import { ChartTooltip } from "./tooltip";

const INCOME = "#16a34a";
const EXPENSE = "#ef4444";

export function IncomeExpenseChart({ daily, weekly, label, income, expenses }: { daily: Point[]; weekly: Point[]; label: string; income: number; expenses: number }) {
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const id = useId().replace(/:/g, "");
  const data = mode === "daily" ? daily : weekly;
  const ticks = mode === "daily" ? daily.filter((_, i) => i === 0 || (i + 1) % 5 === 0 || i === daily.length - 1).map((d) => d.label) : undefined;
  const empty = income === 0 && expenses === 0;

  return (
    <section className="card" aria-labelledby={`${id}-t`}>
      <div className="card-head">
        <h2 id={`${id}-t`}>הכנסות מול הוצאות</h2>
        <label className="select-btn">
          <span className="visually-hidden">תצוגה</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as "daily" | "weekly")} style={{ border: 0, background: "transparent", outline: "none", cursor: "pointer" }}>
            <option value="daily">לפי ימים</option>
            <option value="weekly">לפי שבועות</option>
          </select>
        </label>
      </div>
      <div className="legend" aria-hidden>
        <span><i className="sw tone-income" />הכנסות</span>
        <span><i className="sw dashed" />הוצאות</span>
      </div>
      {empty ? (
        <div className="empty" style={{ minHeight: 230 }}><p>הגרף יופיע כאן אחרי שתוסיפו הכנסות או הוצאות.</p></div>
      ) : (
      <div className="chart-box" role="img" aria-label={`גרף קווי של הכנסות והוצאות ב${label}. הכנסות: ${formatILS(income)}, הוצאות: ${formatILS(expenses)}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={`${id}-inc`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INCOME} stopOpacity={0.18} />
                <stop offset="100%" stopColor={INCOME} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id={`${id}-exp`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.14} />
                <stop offset="100%" stopColor={EXPENSE} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#eef1f6" vertical={false} />
            <XAxis dataKey="label" reversed ticks={ticks} interval={mode === "daily" ? "preserveStartEnd" : 0} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 12 }} tickMargin={8} />
            <YAxis orientation="right" domain={[0, "auto"]} tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="income" name="הכנסות" stroke="none" fill={`url(#${id}-inc)`} tooltipType="none" isAnimationActive={false} />
            <Area type="monotone" dataKey="expenses" name="הוצאות" stroke="none" fill={`url(#${id}-exp)`} tooltipType="none" isAnimationActive={false} />
            <Line type="monotone" dataKey="income" name="הכנסות" stroke={INCOME} strokeWidth={2} dot={mode === "weekly" ? { r: 4, strokeWidth: 2, fill: "#fff" } : false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="expenses" name="הוצאות" stroke={EXPENSE} strokeWidth={2} strokeDasharray="6 4" dot={mode === "weekly" ? { r: 4, strokeWidth: 2, fill: "#fff" } : false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
