"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Point = {
  date: string;
  actual: number | null;
  forecastMa: number | null;
  forecastTrend: number | null;
};

export function ForecastChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
            formatter={(v) =>
              typeof v === "number" ? v.toFixed(1) + " kg" : "-"
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="actual"
            name="実績(kg)"
            stroke="#0ea5e9"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="forecastMa"
            name="予測 移動平均"
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="5 3"
            connectNulls={false}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="forecastTrend"
            name="予測 線形トレンド"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            connectNulls={false}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
