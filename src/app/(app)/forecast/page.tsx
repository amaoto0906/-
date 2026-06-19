import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { generateFeedForecast, movingAverageForecast, linearTrendForecast } from "@/lib/services/forecast";
import { toDateKey } from "@/lib/utils";
import { ForecastChart } from "./forecast-chart";
import { imageAssets } from "@/lib/image-assets";
import { Activity, AlertTriangle, LineChart, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SP = { pond?: string; horizon?: string };

export default async function ForecastPage({ searchParams }: { searchParams: SP }) {
  const ponds = await prisma.pond.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  const horizon = Math.max(7, Math.min(30, Number(searchParams.horizon ?? 14)));
  const pondId = searchParams.pond ?? ponds[0]?.id;

  if (!pondId) {
    return (
      <div>
        <PageHeader title="生産量・給餌量 予測" />
        <div className="p-8">
          <div className="card p-12 text-center text-slate-500 animate-fade-in-up">
            予測対象の池がありません。<Link href="/masters/ponds" className="font-medium text-sky-700 hover:text-sky-900">池マスタを追加</Link>してください。
          </div>
        </div>
      </div>
    );
  }

  const pond = await prisma.pond.findUnique({ where: { id: pondId } });

  // 過去14日の給餌履歴を取得
  const now = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);

  const logs = await prisma.feedingLog.findMany({
    where: { pondId, recordedAt: { gte: from, lte: now } },
    orderBy: { recordedAt: "asc" },
  });

  // 日別に集約
  const dailyMap = new Map<string, number>();
  for (const l of logs) {
    const k = toDateKey(l.recordedAt);
    dailyMap.set(k, (dailyMap.get(k) ?? 0) + l.amountKg);
  }
  const history = Array.from(dailyMap.entries())
    .sort()
    .map(([date, value]) => ({ date, value }));

  let forecastMa: number[] = [];
  let forecastTrend: number[] = [];
  let dataLackMessage: string | null = null;

  if (history.length < 5) {
    dataLackMessage = `データが不足しています (${history.length}日分しかありません)。最低5日分の給餌記録が必要です。これは参考値であり、信頼性は限定的です。`;
  }

  if (history.length > 0) {
    const values = history.map((h) => h.value);
    forecastMa = movingAverageForecast(values, horizon);
    forecastTrend = linearTrendForecast(values, horizon);
    // 予測を保存
    await generateFeedForecast(pondId, horizon);
  }

  // チャート用データ
  const chartData = [
    ...history.map((h) => ({
      date: h.date,
      actual: h.value,
      forecastMa: null as number | null,
      forecastTrend: null as number | null,
    })),
  ];
  for (let i = 0; i < horizon; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    chartData.push({
      date: toDateKey(d),
      actual: null as unknown as number,
      forecastMa: forecastMa[i] ?? null,
      forecastTrend: forecastTrend[i] ?? null,
    });
  }

  return (
    <div>
      <PageHeader
        title="予測 (給餌量)"
        description={pond ? `[${pond.code}] ${pond.name} - ${horizon}日先まで予測` : ""}
      />
      <div className="space-y-6 p-8">
        <section className="image-hero min-h-[220px] animate-fade-in-up">
          <picture>
            <source srcSet={imageAssets.forecastAnalytics.webp} type="image/webp" />
            <img
              src={imageAssets.forecastAnalytics.jpg}
              alt={imageAssets.forecastAnalytics.alt}
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
          </picture>
          <div className="relative z-10 flex min-h-[220px] max-w-3xl flex-col justify-end p-6 text-white">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <LineChart className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold tracking-normal">給餌量の変化を先読み</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              直近の給餌記録から傾向を確認し、次の作業計画に使う参考値を落ち着いて比較できます。
            </p>
          </div>
        </section>

        <form className="card grid gap-4 p-4 md:flex md:items-end">
          <div>
            <label className="label">池・水槽</label>
            <select name="pond" className="input min-w-[200px]" defaultValue={pondId}>
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">予測期間 (日)</label>
            <select name="horizon" className="input" defaultValue={String(horizon)}>
              <option value="7">7日先</option>
              <option value="14">14日先</option>
              <option value="30">30日先</option>
            </select>
          </div>
          <button className="btn-primary">更新</button>
        </form>

        {dataLackMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 animate-fade-in-up">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{dataLackMessage}</span>
          </div>
        )}

        <div className="card p-6 animate-fade-in-up">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">給餌量の推移と予測</h2>
              <p className="mt-1 text-xs text-slate-500">実績値と2つの参考モデルを比較</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <ForecastChart data={chartData} />
          <p className="mt-4 text-xs leading-6 text-slate-500">
            ※ 移動平均モデル (青破線) と線形トレンドモデル (緑破線) の予測値を併記しています。
            予測値はあくまで過去データを基にした参考値であり、断定的なものではありません。
          </p>
        </div>

        {history.length >= 5 && forecastMa.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-6 animate-fade-in-up">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <LineChart className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-bold text-slate-900">移動平均モデル</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-600">
                直近{history.length}日の平均値で次{horizon}日を予測。
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-slate-500">過去平均</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {(history.reduce((s, h) => s + h.value, 0) / history.length).toFixed(1)} kg/日
                </dd>
                <dt className="text-slate-500">予測合計 ({horizon}日)</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {forecastMa.reduce((s, v) => s + v, 0).toFixed(1)} kg
                </dd>
              </dl>
            </div>
            <div className="card p-6 animate-fade-in-up">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-bold text-slate-900">線形トレンドモデル</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-600">
                最小二乗法でトレンドを推定し、次{horizon}日を外挿。
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-slate-500">最終予測値</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {forecastTrend[forecastTrend.length - 1]?.toFixed(1) ?? "-"} kg/日
                </dd>
                <dt className="text-slate-500">予測合計 ({horizon}日)</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {forecastTrend.reduce((s, v) => s + v, 0).toFixed(1)} kg
                </dd>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
