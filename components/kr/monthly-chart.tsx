"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPLN } from "@/lib/format";

export interface MonthRow {
  month: string;
  a: number;
  b: number;
}

export function MonthlyChart({ data, nameA, nameB }: { data: MonthRow[]; nameA: string; nameB?: string }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E2DC" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5C6966" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 12, fill: "#5C6966" }}
            tickFormatter={(v: number) => (v >= 1000 ? `${String(Math.round(v / 100) / 10).replace(".", ",")}k` : String(v))}
          />
          <Tooltip
            separator=": "
            formatter={(v, key) => [formatPLN(Number(v)), key === "a" ? nameA : nameB ?? ""]}
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E2DC" }}
          />
          <Bar dataKey="a" stackId="m" fill="#0E7C66" radius={[0, 0, 4, 4]} />
          {nameB && <Bar dataKey="b" stackId="m" fill="#5B5FC7" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
