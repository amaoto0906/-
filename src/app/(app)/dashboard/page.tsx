import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { DashboardChart } from "./chart";
import { prisma } from "@/lib/prisma";
import {
  getDailyTotals,
  getDashboardSummary,
  getBySpecies,
  getByPondDetail,
  periodRange,
} from "@/lib/services/aggregation";
import { formatNumber } from "@/lib/utils";
import { imageAssets } from "@/lib/image-assets";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Period = "today" | "week" | "month";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  // パフォーマンス: 集計の再計算と異常検知は給餌/生産記録の書き込み時に
  // 既に走るため、ダッシュボード表示ごとには実行しない。
  // 必要なら /api/refresh などで手動再実行できるよう Phase 2 で追加予定。

  const period = (["today", "week", "month"].includes(searchParams.period ?? "")
    ? (searchParams.period as Period)
    : "month") as Period;
  const { from: pFrom, to: pTo, label: periodLabel } = periodRange(period);

  // KPI / グラフ / 状況パネル / アラート を一括で並列取得
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const [summary, series, bySpecies, byPond, recentAlerts] = await Promise.all([
    getDashboardSummary(),
    getDailyTotals(from, to),
    getBySpecies(pFrom, pTo),
    getByPondDetail(pFrom, pTo),
    prisma.anomalyAlert.findMany({
      where: { acknowledgedAt: null },
      orderBy: { detectedAt: "desc" },
      take: 5,
      include: { pond: true },
    }),
  ]);

  const tabs: { id: Period; label: string }[] = [
    { id: "today", label: "本日" },
    { id: "week", label: "今週" },
    { id: "month", label: "今月" },
  ];

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        description="養魚場の運営状況をリアルタイムで把握"
      />
      <div className="p-8">
        <section className="relative mb-6 min-h-[240px] overflow-hidden rounded-lg bg-slate-900 shadow-sm">
          <picture>
            <source srcSet={imageAssets.dashboardAerial.webp} type="image/webp" />
            <img
              src={imageAssets.dashboardAerial.jpg}
              alt={imageAssets.dashboardAerial.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/15" />
          <div className="relative z-10 flex min-h-[240px] max-w-3xl flex-col justify-end p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-normal text-sky-100">
              Offshore Cage Overview
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">
              本日の海面養殖オペレーション
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              水質、給餌、魚群状態、作業記録を同じ文脈で確認し、現場判断に必要な情報へ素早く移動できます。
            </p>
          </div>
        </section>

        <div className="card p-1 inline-flex gap-1 mb-4">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard?period=${t.id}`}
              className={
                t.id === period
                  ? "btn-primary text-sm py-1 px-4"
                  : "btn-secondary text-sm py-1 px-4 border-transparent"
              }
            >
              {t.label}
            </Link>
          ))}
          <span className="text-xs text-slate-500 px-3 self-center">{periodLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="月間給餌量"
            value={summary.feed.current}
            unit="kg"
            change={summary.feed.change}
            icon="🍚"
          />
          <KpiCard
            label="月間生産量"
            value={summary.production.current}
            unit="kg"
            change={summary.production.change}
            icon="🐟"
          />
          <KpiCard
            label="月間死亡数"
            value={summary.mortality.current}
            unit="匹"
            icon="⚠️"
          />
          <KpiCard
            label="FCR (飼料係数)"
            value={summary.fcr}
            unit=""
            icon="📊"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-bold text-slate-800 mb-4">直近30日の推移</h2>
            <DashboardChart data={series} />
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">アラート</h2>
              <Link href="/anomalies" className="text-xs text-sky-600">
                すべて見る →
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="text-center">
                <picture>
                  <source srcSet={imageAssets.emptyNoAlerts.webp} type="image/webp" />
                  <img
                    src={imageAssets.emptyNoAlerts.jpg}
                    alt={imageAssets.emptyNoAlerts.alt}
                    className="mx-auto h-28 w-28 rounded-lg object-cover"
                  />
                </picture>
                <p className="mt-3 text-sm text-slate-500">
                  現在、未確認のアラートはありません。
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentAlerts.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span
                      className={
                        a.severity === "critical"
                          ? "badge-critical"
                          : a.severity === "warning"
                            ? "badge-warning"
                            : "badge-info"
                      }
                    >
                      {a.severity}
                    </span>
                    <div className="mt-1 text-slate-700">{a.message}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {a.detectedAt.toLocaleString("ja-JP")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 池別 + 魚種別 状況 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4">
              🌊 池・水槽別状況 ({periodLabel})
            </h2>
            {byPond.length === 0 ? (
              <p className="text-sm text-slate-500">データなし</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b">
                      <th className="text-left py-2">池</th>
                      <th className="text-right py-2">給餌(kg)</th>
                      <th className="text-right py-2">生産(kg)</th>
                      <th className="text-right py-2">FCR</th>
                      <th className="text-right py-2">水温(℃)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPond.map((p) => (
                      <tr key={p.pondId} className="border-b">
                        <td className="py-2">
                          <Link href={`/feeding?pond=${p.pondId}`} className="text-sky-600">
                            [{p.code}] {p.name}
                          </Link>
                        </td>
                        <td className="text-right font-mono">{formatNumber(p.feed)}</td>
                        <td className="text-right font-mono">{formatNumber(p.production)}</td>
                        <td className="text-right font-mono">
                          {p.fcr != null ? p.fcr.toFixed(2) : "-"}
                        </td>
                        <td className="text-right font-mono">
                          {p.tempC != null ? p.tempC.toFixed(1) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4">
              🐠 魚種別状況 ({periodLabel})
            </h2>
            {bySpecies.length === 0 ? (
              <p className="text-sm text-slate-500">期間内の生産記録なし</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b">
                    <th className="text-left py-2">魚種</th>
                    <th className="text-right py-2">出荷尾数</th>
                    <th className="text-right py-2">出荷重量(kg)</th>
                    <th className="text-right py-2">死亡数</th>
                  </tr>
                </thead>
                <tbody>
                  {bySpecies.map((s) => (
                    <tr key={s.speciesId} className="border-b">
                      <td className="py-2 font-medium">{s.nameJa}</td>
                      <td className="text-right font-mono">{s.count.toLocaleString()}</td>
                      <td className="text-right font-mono">{formatNumber(s.production)}</td>
                      <td className="text-right font-mono">{s.mortality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link href="/feeding/new" className="card overflow-hidden hover:bg-sky-50 transition-colors">
            <picture>
              <source srcSet={imageAssets.feedingManagement.webp} type="image/webp" />
              <img
                src={imageAssets.feedingManagement.jpg}
                alt={imageAssets.feedingManagement.alt}
                className="h-32 w-full object-cover"
              />
            </picture>
            <div className="p-5">
              <div className="font-bold text-slate-800">給餌入力</div>
              <div className="text-xs text-slate-500 mt-1">本日の給餌量を記録</div>
            </div>
          </Link>
          <Link href="/production/new" className="card overflow-hidden hover:bg-sky-50 transition-colors">
            <picture>
              <source srcSet={imageAssets.fishHealth.webp} type="image/webp" />
              <img
                src={imageAssets.fishHealth.jpg}
                alt={imageAssets.fishHealth.alt}
                className="h-32 w-full object-cover"
              />
            </picture>
            <div className="p-5">
              <div className="font-bold text-slate-800">生産入力</div>
              <div className="text-xs text-slate-500 mt-1">出荷・死亡数を記録</div>
            </div>
          </Link>
          <Link href="/water-quality/new" className="card overflow-hidden hover:bg-sky-50 transition-colors">
            <picture>
              <source srcSet={imageAssets.waterQuality.webp} type="image/webp" />
              <img
                src={imageAssets.waterQuality.jpg}
                alt={imageAssets.waterQuality.alt}
                className="h-32 w-full object-cover"
              />
            </picture>
            <div className="p-5">
              <div className="font-bold text-slate-800">水質入力</div>
              <div className="text-xs text-slate-500 mt-1">測定値を現場から記録</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
