import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/utils";

function isoWeekRange(weekKey: string): { from: Date; to: Date } {
  // weekKey: YYYY-Www (例: 2026-W25)
  const [yearStr, wStr] = weekKey.split("-W");
  const year = Number(yearStr);
  const week = Number(wStr);
  const jan4 = new Date(year, 0, 4);
  const day = (jan4.getDay() + 6) % 7;
  const week1Mon = new Date(jan4);
  week1Mon.setDate(jan4.getDate() - day);
  const from = new Date(week1Mon);
  from.setDate(week1Mon.getDate() + (week - 1) * 7);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function monthRange(monthKey: string): { from: Date; to: Date } {
  // monthKey: YYYY-MM
  const [yearStr, mStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(mStr) - 1;
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

/**
 * 日報用AIコメントを生成（テンプレート方式）
 * Phase 2でLLMに置き換え可能なインターフェース
 */
export async function generateDailyComment(date: string): Promise<string> {
  // 当日 / 前日 / 7日前との比較
  const today = new Date(date);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayAgg, yesterdayAgg, weekAggs, alerts] = await Promise.all([
    prisma.dailyAggregate.findMany({ where: { date } }),
    prisma.dailyAggregate.findMany({ where: { date: toDateKey(yesterday) } }),
    prisma.dailyAggregate.findMany({
      where: { date: { gte: toDateKey(weekAgo), lt: date } },
    }),
    prisma.anomalyAlert.findMany({
      where: {
        detectedAt: {
          gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: { pond: true },
    }),
  ]);

  const sumFeed = (arr: typeof todayAgg) =>
    arr.reduce((s, a) => s + a.totalFeedKg, 0);
  const sumProd = (arr: typeof todayAgg) =>
    arr.reduce((s, a) => s + a.totalProductionKg, 0);
  const sumMort = (arr: typeof todayAgg) =>
    arr.reduce((s, a) => s + a.totalMortalityCount, 0);

  const tFeed = sumFeed(todayAgg);
  const yFeed = sumFeed(yesterdayAgg);
  const wFeedAvg = weekAggs.length > 0 ? sumFeed(weekAggs) / 7 : 0;

  const tProd = sumProd(todayAgg);
  const tMort = sumMort(todayAgg);

  const lines: string[] = [];
  lines.push(`【${date} 日報サマリー】`);
  lines.push(
    `本日の総給餌量は ${tFeed.toFixed(1)} kg、生産量は ${tProd.toFixed(1)} kg、死亡数は ${tMort} 匹でした。`,
  );

  if (yFeed > 0) {
    const pct = ((tFeed - yFeed) / yFeed) * 100;
    const trend = pct > 5 ? "増加" : pct < -5 ? "減少" : "横ばい";
    lines.push(
      `給餌量は前日比 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% で${trend}傾向です。`,
    );
  }

  if (wFeedAvg > 0) {
    const pct = ((tFeed - wFeedAvg) / wFeedAvg) * 100;
    lines.push(
      `直近7日平均(${wFeedAvg.toFixed(1)}kg)との比較では ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% です。`,
    );
  }

  if (alerts.length > 0) {
    lines.push("");
    lines.push(`⚠️ 直近24時間で ${alerts.length} 件のアラートが検知されています:`);
    for (const a of alerts.slice(0, 5)) {
      lines.push(`・${a.message}`);
    }
  } else {
    lines.push("本日の異常検知は発生していません。");
  }

  const text = lines.join("\n");

  await prisma.aiComment.upsert({
    where: { reportType_periodKey: { reportType: "daily", periodKey: date } },
    update: { generatedText: text },
    create: { reportType: "daily", periodKey: date, generatedText: text },
  });

  return text;
}

/**
 * 週報用AIコメント
 */
export async function generateWeeklyComment(weekKey: string): Promise<string> {
  const { from, to } = isoWeekRange(weekKey);
  const prev = new Date(from);
  prev.setDate(prev.getDate() - 7);
  const prevTo = new Date(to);
  prevTo.setDate(prevTo.getDate() - 7);

  const fromKey = toDateKey(from);
  const toKey = toDateKey(to);
  const prevFromKey = toDateKey(prev);
  const prevToKey = toDateKey(prevTo);

  const [current, previous, alerts] = await Promise.all([
    prisma.dailyAggregate.findMany({ where: { date: { gte: fromKey, lte: toKey } } }),
    prisma.dailyAggregate.findMany({
      where: { date: { gte: prevFromKey, lte: prevToKey } },
    }),
    prisma.anomalyAlert.findMany({
      where: { detectedAt: { gte: from, lte: to } },
      include: { pond: true },
    }),
  ]);

  const sumF = (arr: typeof current) => arr.reduce((s, a) => s + a.totalFeedKg, 0);
  const sumP = (arr: typeof current) => arr.reduce((s, a) => s + a.totalProductionKg, 0);
  const sumM = (arr: typeof current) => arr.reduce((s, a) => s + a.totalMortalityCount, 0);

  const cF = sumF(current);
  const pF = sumF(previous);
  const cP = sumP(current);
  const pP = sumP(previous);
  const cM = sumM(current);

  const lines: string[] = [];
  lines.push(`【${weekKey} (${toDateKey(from)}〜${toDateKey(to)}) 週報サマリー】`);
  lines.push(
    `週間の給餌量は ${cF.toFixed(1)} kg、生産量は ${cP.toFixed(1)} kg、死亡数は ${cM} 匹でした。`,
  );
  if (pF > 0) {
    const pct = ((cF - pF) / pF) * 100;
    lines.push(`給餌量は前週比 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% です。`);
  }
  if (pP > 0) {
    const pct = ((cP - pP) / pP) * 100;
    lines.push(`生産量は前週比 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% です。`);
  }
  if (cP > 0) {
    lines.push(`週間FCR(飼料係数)は ${(cF / cP).toFixed(2)} です。`);
  }
  if (alerts.length > 0) {
    lines.push("");
    lines.push(`⚠️ 週間で ${alerts.length} 件のアラートが検知されています:`);
    for (const a of alerts.slice(0, 5)) lines.push(`・${a.message}`);
  } else {
    lines.push("週間で異常検知は発生していません。");
  }

  const text = lines.join("\n");
  await prisma.aiComment.upsert({
    where: { reportType_periodKey: { reportType: "weekly", periodKey: weekKey } },
    update: { generatedText: text },
    create: { reportType: "weekly", periodKey: weekKey, generatedText: text },
  });
  return text;
}

/**
 * 月報用AIコメント
 */
export async function generateMonthlyComment(monthKey: string): Promise<string> {
  const { from, to } = monthRange(monthKey);
  const prev = new Date(from);
  prev.setMonth(prev.getMonth() - 1);
  const prevTo = new Date(from);
  prevTo.setDate(0);
  prevTo.setHours(23, 59, 59, 999);

  const fromKey = toDateKey(from);
  const toKey = toDateKey(to);
  const prevFromKey = toDateKey(prev);
  const prevToKey = toDateKey(prevTo);

  const [current, previous, alerts, bySpecies] = await Promise.all([
    prisma.dailyAggregate.findMany({ where: { date: { gte: fromKey, lte: toKey } } }),
    prisma.dailyAggregate.findMany({
      where: { date: { gte: prevFromKey, lte: prevToKey } },
    }),
    prisma.anomalyAlert.findMany({
      where: { detectedAt: { gte: from, lte: to } },
      include: { pond: true },
    }),
    prisma.productionLog.findMany({
      where: { recordedAt: { gte: from, lte: to } },
      include: { species: true },
    }),
  ]);

  const sumF = (arr: typeof current) => arr.reduce((s, a) => s + a.totalFeedKg, 0);
  const sumP = (arr: typeof current) => arr.reduce((s, a) => s + a.totalProductionKg, 0);
  const sumM = (arr: typeof current) => arr.reduce((s, a) => s + a.totalMortalityCount, 0);

  const cF = sumF(current);
  const pF = sumF(previous);
  const cP = sumP(current);
  const pP = sumP(previous);
  const cM = sumM(current);

  const speciesMap = new Map<string, { name: string; kg: number }>();
  for (const p of bySpecies) {
    const cur = speciesMap.get(p.speciesId) ?? { name: p.species.nameJa, kg: 0 };
    cur.kg += p.harvestedWeightKg;
    speciesMap.set(p.speciesId, cur);
  }
  const topSpecies = Array.from(speciesMap.values()).sort((a, b) => b.kg - a.kg)[0];

  const lines: string[] = [];
  lines.push(`【${monthKey} 月報サマリー】`);
  lines.push(
    `月間の給餌量は ${cF.toFixed(1)} kg、生産量は ${cP.toFixed(1)} kg、死亡数は ${cM} 匹でした。`,
  );
  if (pF > 0) {
    const pct = ((cF - pF) / pF) * 100;
    lines.push(`給餌量は前月比 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% です。`);
  }
  if (pP > 0) {
    const pct = ((cP - pP) / pP) * 100;
    lines.push(`生産量は前月比 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% です。`);
  }
  if (cP > 0) {
    lines.push(`月間FCR(飼料係数)は ${(cF / cP).toFixed(2)} です。`);
  }
  if (topSpecies) {
    lines.push(`生産量最大の魚種は ${topSpecies.name} (${topSpecies.kg.toFixed(1)} kg) です。`);
  }
  if (alerts.length > 0) {
    lines.push("");
    lines.push(`⚠️ 月間で ${alerts.length} 件のアラートが検知されています:`);
    for (const a of alerts.slice(0, 8)) lines.push(`・${a.message}`);
  } else {
    lines.push("月間で異常検知は発生していません。");
  }

  const text = lines.join("\n");
  await prisma.aiComment.upsert({
    where: { reportType_periodKey: { reportType: "monthly", periodKey: monthKey } },
    update: { generatedText: text },
    create: { reportType: "monthly", periodKey: monthKey, generatedText: text },
  });
  return text;
}

export { isoWeekRange, monthRange };
