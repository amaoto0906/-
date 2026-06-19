import { PageHeader } from "@/components/page-header";
import { formatNumber } from "@/lib/utils";
import { generateWeeklyComment, isoWeekRange } from "@/lib/services/ai-comment";
import { getBySpecies, getByPondDetail } from "@/lib/services/aggregation";
import { toDateKey } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WeeklyReportPage({
  params,
}: {
  params: { week: string };
}) {
  if (!/^\d{4}-W\d{2}$/.test(params.week)) return notFound();
  const { from, to } = isoWeekRange(params.week);
  const [comment, bySpecies, byPond] = await Promise.all([
    generateWeeklyComment(params.week),
    getBySpecies(from, to),
    getByPondDetail(from, to),
  ]);

  const totals = byPond.reduce(
    (acc, p) => ({
      feed: acc.feed + p.feed,
      production: acc.production + p.production,
      mortality: acc.mortality + p.mortality,
    }),
    { feed: 0, production: 0, mortality: 0 },
  );

  return (
    <div>
      <PageHeader
        title={`週報: ${params.week}`}
        description={`${toDateKey(from)} 〜 ${toDateKey(to)}`}
        action={{
          href: `/api/reports/weekly/pdf?week=${params.week}`,
          label: "📄 PDFダウンロード",
        }}
      />
      <div className="p-8 max-w-4xl">
        <div className="card p-8 space-y-6">
          <header className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">養魚場 週次報告書</h2>
            <p className="text-slate-500 mt-1">
              対象: {params.week} ({toDateKey(from)} 〜 {toDateKey(to)})
            </p>
          </header>

          <section>
            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
              1. サマリー
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">給餌総量</div>
                <div className="text-xl font-bold">{formatNumber(totals.feed)} kg</div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">生産総量</div>
                <div className="text-xl font-bold">{formatNumber(totals.production)} kg</div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-xs text-slate-500">死亡数</div>
                <div className="text-xl font-bold">{totals.mortality} 匹</div>
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
                  <th className="text-right p-2">給餌(kg)</th>
                  <th className="text-right p-2">生産(kg)</th>
                  <th className="text-right p-2">死亡数</th>
                  <th className="text-right p-2">FCR</th>
                </tr>
              </thead>
              <tbody>
                {byPond.map((p) => (
                  <tr key={p.pondId} className="border-b">
                    <td className="p-2">[{p.code}] {p.name}</td>
                    <td className="text-right p-2 font-mono">{formatNumber(p.feed)}</td>
                    <td className="text-right p-2 font-mono">{formatNumber(p.production)}</td>
                    <td className="text-right p-2 font-mono">{p.mortality}</td>
                    <td className="text-right p-2 font-mono">{p.fcr != null ? p.fcr.toFixed(2) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {bySpecies.length > 0 && (
            <section>
              <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3">
                4. 魚種別集計
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">魚種</th>
                    <th className="text-right p-2">出荷尾数</th>
                    <th className="text-right p-2">出荷重量(kg)</th>
                    <th className="text-right p-2">死亡数</th>
                  </tr>
                </thead>
                <tbody>
                  {bySpecies.map((s) => (
                    <tr key={s.speciesId} className="border-b">
                      <td className="p-2">{s.nameJa}</td>
                      <td className="text-right p-2 font-mono">{s.count.toLocaleString()}</td>
                      <td className="text-right p-2 font-mono">{formatNumber(s.production)}</td>
                      <td className="text-right p-2 font-mono">{s.mortality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
