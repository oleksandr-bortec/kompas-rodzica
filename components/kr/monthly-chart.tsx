"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { shade } from "@/components/kr/timeline";
import { formatPLN, monthShort } from "@/lib/format";

export interface MonthRow {
  /** YYYY-MM — unique key (month names repeat after a year). */
  month: string;
  a: number;
  b: number;
  rateA: number;
  rateB: number;
}

/** Most common payment % of a parent in the chart (for the legend swatch). */
function typicalRate(data: MonthRow[], key: "rateA" | "rateB") {
  const counts = new Map<number, number>();
  for (const r of data) if (r[key] > 0) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
  return [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? 100;
}

export function MonthlyChart({ data, nameA, nameB }: { data: MonthRow[]; nameA: string; nameB?: string }) {
  // Zero months become null so the tooltip lists only the parent who is paid that month.
  const rows = data.map((r) => ({ ...r, a: r.a || null, b: r.b || null }));
  const showB = !!nameB && data.some((r) => r.b > 0);
  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 kr-small text-kr-text-2">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: shade("A", typicalRate(data, "rateA")) }} aria-hidden />
          {nameA}
        </span>
        {showB && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: shade("B", typicalRate(data, "rateB")) }} aria-hidden />
            {nameB}
          </span>
        )}
        <span>· odcień = procent podstawy, jak na osi czasu</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E5E2DC" />
            <XAxis dataKey="month" tickFormatter={(m: string) => monthShort(m)} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5C6966" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: "#5C6966" }}
              tickFormatter={(v: number) => (v >= 1000 ? `${String(Math.round(v / 100) / 10).replace(".", ",")}k` : String(v))}
            />
            <Tooltip
              separator=": "
              labelFormatter={(m) => `${monthShort(String(m))} ${String(m).slice(0, 4)}`}
              cursor={{ fill: "rgba(29,38,36,0.06)" }}
              formatter={(v, _name, item) => {
                const row = item.payload as MonthRow;
                const isA = item.dataKey === "a";
                const rate = isA ? row.rateA : row.rateB;
                return [`${formatPLN(Number(v))} (${String(rate).replace(".", ",")}%)`, isA ? nameA : nameB ?? ""];
              }}
              contentStyle={{ borderRadius: 12, border: "1px solid #E5E2DC" }}
            />
            {/* No grow animation: it freezes half-way in background tabs and screenshots. */}
            <Bar dataKey="a" stackId="m" fill="#0E7C66" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((r, i) => <Cell key={i} fill={shade("A", r.rateA || 100)} />)}
            </Bar>
            {showB && (
              <Bar dataKey="b" stackId="m" fill="#5B5FC7" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {rows.map((r, i) => <Cell key={i} fill={shade("B", r.rateB || 100)} />)}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
