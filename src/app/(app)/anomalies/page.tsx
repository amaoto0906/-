import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { acknowledgeAlert } from "./actions";
import { revalidatePath } from "next/cache";
import { imageAssets } from "@/lib/image-assets";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const severityBadge: Record<string, string> = {
  critical: "badge-critical",
  warning: "badge-warning",
  info: "badge-info",
};

const typeLabel: Record<string, string> = {
  feed_spike: "給餌量スパイク",
  mortality_spike: "死亡数スパイク",
  fcr_anomaly: "FCR異常",
  missing_input: "入力欠損",
  production_drop: "生産量急減",
};

export default async function AnomaliesPage() {
  const alerts = await prisma.anomalyAlert.findMany({
    orderBy: [{ acknowledgedAt: "asc" }, { detectedAt: "desc" }],
    take: 100,
    include: { pond: true },
  });

  const openCount = alerts.filter((a) => !a.acknowledgedAt).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const acknowledgedCount = alerts.length - openCount;

  return (
    <div>
      <PageHeader
        title="異常検知アラート"
        description="ルールベース異常検知（給餌スパイク・死亡数スパイク・FCR異常・入力欠損）"
      />
      <div className="space-y-6 p-8">
        <section className="image-hero min-h-[220px] animate-fade-in-up">
          <picture>
            <source srcSet={imageAssets.alertMonitoring.webp} type="image/webp" />
            <img
              src={imageAssets.alertMonitoring.jpg}
              alt={imageAssets.alertMonitoring.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <div className="relative z-10 flex min-h-[220px] max-w-3xl flex-col justify-end p-6 text-white">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold tracking-normal">注意すべき変化を先に確認</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              未確認アラートを上位に保ちながら、発生状況と確認状態を同じ画面で整理します。
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">未確認</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{openCount}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
          <div className="card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">重大</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{criticalCount}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
          <div className="card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">確認済み</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{acknowledgedCount}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden animate-fade-in-up">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="table-th">状態</th>
                <th className="table-th">重要度</th>
                <th className="table-th">種別</th>
                <th className="table-th">池</th>
                <th className="table-th">内容</th>
                <th className="table-th">検知日時</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-td py-10 text-center text-slate-500">
                    <div className="mx-auto max-w-xs">
                      <picture>
                        <source srcSet={imageAssets.emptyNoAlerts.webp} type="image/webp" />
                        <img
                          src={imageAssets.emptyNoAlerts.jpg}
                          alt={imageAssets.emptyNoAlerts.alt}
                          className="mx-auto mb-4 h-28 w-28 rounded-lg object-cover"
                        />
                      </picture>
                      アラートはありません
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="table-td">
                      {a.acknowledgedAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          確認済
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          未確認
                        </span>
                      )}
                    </td>
                    <td className="table-td">
                      <span className={severityBadge[a.severity] ?? "badge-info"}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="table-td font-medium text-slate-800">{typeLabel[a.type] ?? a.type}</td>
                    <td className="table-td">{a.pond.name}</td>
                    <td className="table-td">{a.message}</td>
                    <td className="table-td text-xs">
                      {a.detectedAt.toLocaleString("ja-JP")}
                    </td>
                    <td className="table-td text-right">
                      {!a.acknowledgedAt && (
                        <form
                          action={async () => {
                            "use server";
                            await acknowledgeAlert(a.id);
                            revalidatePath("/anomalies");
                          }}
                        >
                          <button type="submit" className="btn-secondary gap-1 px-2 py-1 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            確認
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
