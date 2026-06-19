import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/utils";

/**
 * 指定期間の日次集計を計算して daily_aggregates に upsert
 */
export async function recalcDailyAggregates(pondId: string, from: Date, to: Date) {
  const feeds = await prisma.feedingLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: to } },
  });
  const prods = await prisma.productionLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: to } },
  });

  const byDate = new Map<
    string,
    { feed: number; production: number; mortality: number }
  >();

  for (const f of feeds) {
    const k = toDateKey(f.recordedAt);
    const cur = byDate.get(k) ?? { feed: 0, production: 0, mortality: 0 };
    cur.feed += f.amountKg;
    byDate.set(k, cur);
  }
  for (const p of prods) {
    const k = toDateKey(p.recordedAt);
    const cur = byDate.get(k) ?? { feed: 0, production: 0, mortality: 0 };
    cur.production += p.harvestedWeightKg;
    cur.mortality += p.mortalityCount;
    byDate.set(k, cur);
  }

  for (const [date, v] of Array.from(byDate.entries())) {
    const fcr = v.production > 0 ? v.feed / v.production : null;
    await prisma.dailyAggregate.upsert({
      where: { pondId_date: { pondId, date } },
      update: {
        totalFeedKg: v.feed,
        totalProductionKg: v.production,
        totalMortalityCount: v.mortality,
        fcr,
      },
      create: {
        pondId,
        date,
        totalFeedKg: v.feed,
        totalProductionKg: v.production,
        totalMortalityCount: v.mortality,
        fcr,
      },
    });
  }
}

/**
 * 全池の直近N日を再計算
 */
export async function recalcAll(days = 35) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const ponds = await prisma.pond.findMany({ select: { id: true } });
  for (const p of ponds) {
    await recalcDailyAggregates(p.id, from, to);
  }
}

/**
 * 日付ごとに全池合計を返す（ダッシュボード用）
 */
export async function getDailyTotals(from: Date, to: Date) {
  const aggs = await prisma.dailyAggregate.findMany({
    where: { date: { gte: toDateKey(from), lte: toDateKey(to) } },
    orderBy: { date: "asc" },
  });
  const map = new Map<
    string,
    { date: string; feed: number; production: number; mortality: number }
  >();
  for (const a of aggs) {
    const cur = map.get(a.date) ?? {
      date: a.date,
      feed: 0,
      production: 0,
      mortality: 0,
    };
    cur.feed += a.totalFeedKg;
    cur.production += a.totalProductionKg;
    cur.mortality += a.totalMortalityCount;
    map.set(a.date, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 期間内の魚種別生産・給餌・死亡の集計
 */
export async function getBySpecies(from: Date, to: Date) {
  const prods = await prisma.productionLog.findMany({
    where: { recordedAt: { gte: from, lte: to } },
    include: { species: true },
  });

  const map = new Map<string, { speciesId: string; nameJa: string; production: number; mortality: number; count: number }>();
  for (const p of prods) {
    const cur = map.get(p.speciesId) ?? {
      speciesId: p.speciesId,
      nameJa: p.species.nameJa,
      production: 0,
      mortality: 0,
      count: 0,
    };
    cur.production += p.harvestedWeightKg;
    cur.mortality += p.mortalityCount;
    cur.count += p.harvestedCount;
    map.set(p.speciesId, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.production - a.production);
}

/**
 * 池別の直近サマリー（給餌・生産・FCR・死亡）
 */
export async function getByPondDetail(from: Date, to: Date) {
  const ponds = await prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  const aggs = await prisma.dailyAggregate.findMany({
    where: { date: { gte: toDateKey(from), lte: toDateKey(to) } },
  });
  const aggBy = new Map<string, { feed: number; production: number; mortality: number; days: number }>();
  for (const a of aggs) {
    const cur = aggBy.get(a.pondId) ?? { feed: 0, production: 0, mortality: 0, days: 0 };
    cur.feed += a.totalFeedKg;
    cur.production += a.totalProductionKg;
    cur.mortality += a.totalMortalityCount;
    cur.days += 1;
    aggBy.set(a.pondId, cur);
  }
  const wq = await prisma.waterQualityLog.findMany({
    where: { recordedAt: { gte: from, lte: to } },
    orderBy: { recordedAt: "desc" },
  });
  const latestWq = new Map<string, { tempC: number | null; ph: number | null; doMgL: number | null }>();
  for (const w of wq) {
    if (!latestWq.has(w.pondId)) {
      latestWq.set(w.pondId, { tempC: w.tempC, ph: w.ph, doMgL: w.doMgL });
    }
  }

  return ponds.map((p) => {
    const a = aggBy.get(p.id) ?? { feed: 0, production: 0, mortality: 0, days: 0 };
    const fcr = a.production > 0 ? a.feed / a.production : null;
    const w = latestWq.get(p.id);
    return {
      pondId: p.id,
      code: p.code,
      name: p.name,
      type: p.type,
      feed: a.feed,
      production: a.production,
      mortality: a.mortality,
      fcr,
      tempC: w?.tempC ?? null,
      ph: w?.ph ?? null,
      doMgL: w?.doMgL ?? null,
    };
  });
}

/**
 * 週別合計（ISO週単位、月曜始まり）
 */
export async function getWeeklyTotals(from: Date, to: Date) {
  const aggs = await prisma.dailyAggregate.findMany({
    where: { date: { gte: toDateKey(from), lte: toDateKey(to) } },
    orderBy: { date: "asc" },
  });

  function isoWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day + 3);
    const firstThursday = new Date(d.getFullYear(), 0, 4);
    const diffWeeks = Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
    return `${d.getFullYear()}-W${String(diffWeeks + 1).padStart(2, "0")}`;
  }

  const map = new Map<string, { week: string; feed: number; production: number; mortality: number }>();
  for (const a of aggs) {
    const k = isoWeek(a.date);
    const cur = map.get(k) ?? { week: k, feed: 0, production: 0, mortality: 0 };
    cur.feed += a.totalFeedKg;
    cur.production += a.totalProductionKg;
    cur.mortality += a.totalMortalityCount;
    map.set(k, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * 月別合計
 */
export async function getMonthlyTotals(from: Date, to: Date) {
  const aggs = await prisma.dailyAggregate.findMany({
    where: { date: { gte: toDateKey(from), lte: toDateKey(to) } },
    orderBy: { date: "asc" },
  });
  const map = new Map<string, { month: string; feed: number; production: number; mortality: number }>();
  for (const a of aggs) {
    const k = a.date.slice(0, 7); // YYYY-MM
    const cur = map.get(k) ?? { month: k, feed: 0, production: 0, mortality: 0 };
    cur.feed += a.totalFeedKg;
    cur.production += a.totalProductionKg;
    cur.mortality += a.totalMortalityCount;
    map.set(k, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 期間プリセットを返すヘルパー
 */
export function periodRange(period: "today" | "week" | "month"): { from: Date; to: Date; label: string } {
  const to = new Date();
  const from = new Date();
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
    return { from, to, label: "本日" };
  }
  if (period === "week") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { from, to, label: "今週 (直近7日)" };
  }
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  return { from, to, label: "今月 (直近30日)" };
}

export async function getDashboardSummary() {
  const now = new Date();
  const from30 = new Date();
  from30.setDate(from30.getDate() - 30);
  const fromPrev30 = new Date();
  fromPrev30.setDate(fromPrev30.getDate() - 60);

  const [current, previous, alerts, pondCount, speciesCount] = await Promise.all([
    prisma.dailyAggregate.findMany({
      where: { date: { gte: toDateKey(from30), lte: toDateKey(now) } },
    }),
    prisma.dailyAggregate.findMany({
      // 前期間は from30 を含めない（境界重複防止）
      where: {
        date: { gte: toDateKey(fromPrev30), lt: toDateKey(from30) },
      },
    }),
    prisma.anomalyAlert.count({ where: { acknowledgedAt: null } }),
    prisma.pond.count(),
    prisma.fishSpecies.count(),
  ]);

  const sum = (arr: typeof current, key: "totalFeedKg" | "totalProductionKg") =>
    arr.reduce((s, x) => s + x[key], 0);
  const mortalitySum = (arr: typeof current) =>
    arr.reduce((s, x) => s + x.totalMortalityCount, 0);

  const curFeed = sum(current, "totalFeedKg");
  const prevFeed = sum(previous, "totalFeedKg");
  const curProd = sum(current, "totalProductionKg");
  const prevProd = sum(previous, "totalProductionKg");
  const curMort = mortalitySum(current);

  const fcr = curProd > 0 ? curFeed / curProd : null;

  const pct = (cur: number, prev: number) =>
    prev > 0 ? ((cur - prev) / prev) * 100 : null;

  return {
    feed: { current: curFeed, change: pct(curFeed, prevFeed) },
    production: { current: curProd, change: pct(curProd, prevProd) },
    mortality: { current: curMort },
    fcr,
    openAlerts: alerts,
    pondCount,
    speciesCount,
  };
}
