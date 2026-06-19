import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { generateDailyComment } from "@/lib/services/ai-comment";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DailyReportPage({
  params,
}: {
  params: { date: string };
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) return notFound();

  const date = params.date;
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const [aggregates, ponds, feedingLogs, productionLogs, comment] =
    await Promise.all([
      prisma.dailyAggregate.findMany({
        where: { date },
        include: { pond: true },
      }),
      prisma.pond.findMany({ orderBy: { code: "asc" } }),
      prisma.feedingLog.findMany({
        where: { recordedAt: { gte: dayStart, lte: dayEnd } },
        include: { pond: true, feed: true },
      }),
      prisma.productionLog.findMany({
        where: { recordedAt: { gte: dayStart, lte: dayEnd } },
        include: { pond: true, species: true },
      }),
      generateDailyComment(date),
    ]);

  const totalFeed = aggregates.reduce((s, a) => s + a.totalFeedKg, 0);
  const totalProd = aggregates.reduce((s, a) => s + a.totalProductionKg, 0);
  const totalMort = aggregates.reduce((s, a) => s + a.totalMortalityCount, 0);

  return (
    <div>
      <PageHeader
        title={`日報: ${date}`}
        description="日次サマリーとAIコメント"
        action={{
          href: `/api/reports/daily/pdf?date=${date}`,
          label: "📄 PDFダウンロード",
        }}
      />
      <div className="p-8 max-w-4xl">
        <div className="card p-8 space-y-6">
          <header className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">養魚場 日次報告書</h2>
            <p className="text-slate-500 mt-1">対象日: {date}</p>
          </header>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              1. サマリー
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">給餌総量</div>
                <div className="text-xl font-bold">
                  {formatNumber(totalFeed)} kg
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">生産総量</div>
                <div className="text-xl font-bold">
                  {formatNumber(totalProd)} kg
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">死亡数</div>
                <div className="text-xl font-bold">{totalMort} 匹</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              2. AIコメント
            </h3>
            <pre className="whitespace-pre-wrap bg-sky-50 border border-sky-100 p-4 rounded text-sm leading-relaxed">
              {comment}
            </pre>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              3. 池別集計
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">池</th>
                  <th className="text-right p-2">給餌量</th>
                  <th className="text-right p-2">生産量</th>
                  <th className="text-right p-2">死亡数</th>
                  <th className="text-right p-2">FCR</th>
                </tr>
              </thead>
              <tbody>
                {ponds.map((p) => {
                  const a = aggregates.find((x) => x.pondId === p.id);
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">
                        [{p.code}] {p.name}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {formatNumber(a?.totalFeedKg ?? 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {formatNumber(a?.totalProductionKg ?? 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {a?.totalMortalityCount ?? 0}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {a?.fcr ? a.fcr.toFixed(2) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              4. 給餌記録 ({feedingLogs.length}件)
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">池</th>
                  <th className="text-left p-2">飼料</th>
                  <th className="text-right p-2">給餌量(kg)</th>
                </tr>
              </thead>
              <tbody>
                {feedingLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-slate-400 p-3">
                      該当データなし
                    </td>
                  </tr>
                ) : (
                  feedingLogs.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="p-2">{l.pond.name}</td>
                      <td className="p-2">{l.feed.name}</td>
                      <td className="text-right p-2 font-mono">
                        {formatNumber(l.amountKg)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              5. 生産記録 ({productionLogs.length}件)
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">池</th>
                  <th className="text-left p-2">魚種</th>
                  <th className="text-right p-2">出荷尾数</th>
                  <th className="text-right p-2">出荷kg</th>
                  <th className="text-right p-2">死亡数</th>
                </tr>
              </thead>
              <tbody>
                {productionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 p-3">
                      該当データなし
                    </td>
                  </tr>
                ) : (
                  productionLogs.map((l) => (
                    <tr key={l.id} className="border-b">
                      <td className="p-2">{l.pond.name}</td>
                      <td className="p-2">{l.species.nameJa}</td>
                      <td className="text-right p-2 font-mono">
                        {l.harvestedCount}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {formatNumber(l.harvestedWeightKg)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {l.mortalityCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
