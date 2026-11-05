"use client";

import { formatILS } from "@/lib/format";

type Item = { name?: string | number; value?: number | string; color?: string; dataKey?: string | number };

export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Item[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={String(p.dataKey)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="dot-sw" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="num">{formatILS(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}
