import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/utils";

/**
 * 移動平均ベースの簡易予測。直近N日の平均値で次M日を外挿。
 */
export function movingAverageForecast(values: number[], horizon: number): number[] {
  if (values.length === 0) return new Array(horizon).fill(0);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return new Array(horizon).fill(avg);
}

/**
 * 線形回帰トレンド。最小二乗で y = ax + b
 */
export function linearTrendForecast(values: number[], horizon: number): number[] {
  if (values.length < 2) return movingAverageForecast(values, horizon);
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = values.reduce((s, _v, i) => s + i * i, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return movingAverageForecast(values, horizon);
  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;
  return Array.from({ length: horizon }, (_, i) => Math.max(0, a * (n + i) + b));
}

/**
 * 給餌量を池ごとに14日先まで予測（移動平均ベース）
 */
export async function generateFeedForecast(pondId: string, horizon = 14) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);

  const logs = await prisma.feedingLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: now } },
    orderBy: { recordedAt: "asc" },
  });
  const dailyMap = new Map<string, number>();
  for (const l of logs) {
    const k = toDateKey(l.recordedAt);
    dailyMap.set(k, (dailyMap.get(k) ?? 0) + l.amountKg);
  }
  const values = Array.from(dailyMap.values());
  const forecast = movingAverageForecast(values, horizon);

  // 保存
  for (let i = 0; i < forecast.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const targetDate = toDateKey(d);
    await prisma.forecastSnapshot.upsert({
      where: {
        pondId_targetDate_metric: { pondId, targetDate, metric: "feed" },
      },
      update: { predictedValue: forecast[i] },
      create: {
        pondId,
        targetDate,
        metric: "feed",
        predictedValue: forecast[i],
      },
    });
  }
  return forecast;
}

export async function getForecastSeries(pondId: string | null, metric = "feed") {
  return prisma.forecastSnapshot.findMany({
    where: pondId ? { pondId, metric } : { metric },
    orderBy: { targetDate: "asc" },
  });
}
