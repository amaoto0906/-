import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/utils";

interface Stats {
  mean: number;
  std: number;
  median: number;
}

function stats(values: number[]): Stats {
  if (values.length === 0) return { mean: 0, std: 0, median: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const sorted = [...values].sort((a, b) => a - b);
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[(sorted.length - 1) / 2];
  return { mean, std, median };
}

/**
 * 給餌量スパイク検知: 直近7日移動平均 ±2σ から外れたら警告
 * "latest" は記録日時が最も新しいもの。今日のデータがなければ判定をスキップ
 * （古い記録に対する偽陽性を防ぐ）。
 */
async function detectFeedSpike(pondId: string, pondName: string) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 8);

  const logs = await prisma.feedingLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: now } },
    orderBy: { recordedAt: "asc" },
  });
  if (logs.length < 4) return null;

  const latest = logs[logs.length - 1];
  // 最新記録が3日以上前ならスキップ（古いデータでアラート発火しない）
  const ageMs = now.getTime() - latest.recordedAt.getTime();
  if (ageMs > 3 * 86400000) return null;

  const history = logs.slice(0, -1).map((l) => l.amountKg);
  const { mean, std } = stats(history);
  const z = std > 0 ? (latest.amountKg - mean) / std : 0;
  if (Math.abs(z) >= 2 && std > 0) {
    return {
      type: "feed_spike",
      severity: Math.abs(z) >= 3 ? "critical" : "warning",
      message: `${pondName}: 給餌量(${latest.amountKg.toFixed(1)}kg)が直近7日平均(${mean.toFixed(1)}kg)から大きく外れています (z=${z.toFixed(2)})`,
    };
  }
  return null;
}

/**
 * 死亡数スパイク検知: 当日死亡数が過去30日中央値の3倍以上
 */
async function detectMortalitySpike(pondId: string, pondName: string) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const logs = await prisma.productionLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: now } },
    orderBy: { recordedAt: "asc" },
  });
  if (logs.length < 5) return null;

  const latest = logs[logs.length - 1];
  // 最新記録が3日以上前ならスキップ
  const ageMs = now.getTime() - latest.recordedAt.getTime();
  if (ageMs > 3 * 86400000) return null;

  const history = logs.slice(0, -1).map((l) => l.mortalityCount);
  const { median } = stats(history);
  const threshold = Math.max(median * 3, 5);
  if (latest.mortalityCount >= threshold && latest.mortalityCount > 0) {
    return {
      type: "mortality_spike",
      severity: latest.mortalityCount >= threshold * 2 ? "critical" : "warning",
      message: `${pondName}: 死亡数(${latest.mortalityCount}匹)が過去30日中央値(${median.toFixed(0)}匹)の${(latest.mortalityCount / Math.max(median, 1)).toFixed(1)}倍です`,
    };
  }
  return null;
}

/**
 * FCR異常: 魚種ごとの基準レンジ外
 */
async function detectFcrAnomaly(pondId: string, pondName: string) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);

  const aggs = await prisma.dailyAggregate.findMany({
    where: { pondId, date: { gte: toDateKey(from) } },
  });
  if (aggs.length === 0) return null;

  const totalFeed = aggs.reduce((s, a) => s + a.totalFeedKg, 0);
  const totalProd = aggs.reduce((s, a) => s + a.totalProductionKg, 0);
  if (totalProd === 0) return null;
  const fcr = totalFeed / totalProd;

  const stock = await prisma.pondStock.findFirst({
    where: { pondId },
    include: { species: true },
    orderBy: { stockedAt: "desc" },
  });
  if (!stock) return null;
  const min = stock.species.targetFcrMin ?? 1.0;
  const max = stock.species.targetFcrMax ?? 2.5;

  if (fcr < min || fcr > max) {
    return {
      type: "fcr_anomaly",
      severity: "warning",
      message: `${pondName}: 直近14日FCR(${fcr.toFixed(2)})が${stock.species.nameJa}の基準レンジ(${min}-${max})を外れています`,
    };
  }
  return null;
}

/**
 * 入力欠損: 連続2日入力なし
 */
async function detectMissingInput(pondId: string, pondName: string) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 3);

  const logs = await prisma.feedingLog.count({
    where: { pondId, recordedAt: { gte: from, lte: now } },
  });
  if (logs === 0) {
    return {
      type: "missing_input",
      severity: "warning" as const,
      message: `${pondName}: 直近3日間の給餌入力がありません`,
    };
  }
  return null;
}

/**
 * 生産量急減検知: 直近7日平均出荷重量に対し、直近2日が30%以下なら警告
 */
async function detectProductionDrop(pondId: string, pondName: string) {
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);

  const logs = await prisma.productionLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: now } },
    orderBy: { recordedAt: "asc" },
  });
  if (logs.length < 4) return null;

  // 出荷重量のある日のみ
  const harvestLogs = logs.filter((l) => l.harvestedWeightKg > 0);
  if (harvestLogs.length < 3) return null;

  const recent2 = harvestLogs.slice(-2);
  const history = harvestLogs.slice(0, -2);
  if (history.length === 0) return null;

  const historyAvg = history.reduce((s, l) => s + l.harvestedWeightKg, 0) / history.length;
  if (historyAvg === 0) return null;
  const recentAvg = recent2.reduce((s, l) => s + l.harvestedWeightKg, 0) / recent2.length;

  if (recentAvg < historyAvg * 0.3) {
    return {
      type: "production_drop",
      severity: "warning" as const,
      message: `${pondName}: 直近2日の生産量(${recentAvg.toFixed(1)}kg/回)が過去平均(${historyAvg.toFixed(1)}kg/回)の30%以下に低下しています`,
    };
  }
  return null;
}

/**
 * 全ルールを実行して新規アラートを記録
 */
export async function runAnomalyDetection() {
  const ponds = await prisma.pond.findMany();
  const results: Array<{
    pondId: string;
    type: string;
    severity: string;
    message: string;
  }> = [];

  for (const pond of ponds) {
    const rules = await Promise.all([
      detectFeedSpike(pond.id, pond.name),
      detectMortalitySpike(pond.id, pond.name),
      detectFcrAnomaly(pond.id, pond.name),
      detectMissingInput(pond.id, pond.name),
      detectProductionDrop(pond.id, pond.name),
    ]);
    for (const r of rules) {
      if (!r) continue;
      results.push({
        pondId: pond.id,
        type: r.type,
        severity: r.severity,
        message: r.message,
      });
    }
  }

  // 直近24時間に同じ pond + type の未確認アラートがあれば重複を避ける
  const recent = new Date();
  recent.setHours(recent.getHours() - 24);

  for (const r of results) {
    const exists = await prisma.anomalyAlert.findFirst({
      where: {
        pondId: r.pondId,
        type: r.type,
        detectedAt: { gte: recent },
      },
    });
    if (exists) continue;
    await prisma.anomalyAlert.create({ data: r });
  }

  return results.length;
}
