import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateJa } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = { type?: string };

function isoWeek(d: Date): string {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day + 3);
  const firstThursday = new Date(dt.getFullYear(), 0, 4);
  const diffWeeks = Math.round((dt.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${dt.getFullYear()}-W${String(diffWeeks + 1).padStart(2, "0")}`;
}

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const type = (["daily", "weekly", "monthly"].includes(searchParams.type ?? "")
    ? searchParams.type
    : "daily") as "daily" | "weekly" | "monthly";

  const tabs: Array<{ id: "daily" | "weekly" | "monthly"; label: string }> = [
    { id: "daily", label: "日報" },
    { id: "weekly", label: "週報" },
    { id: "monthly", label: "月報" },
  ];

  return (
    <div>
      <PageHeader title="帳票" description="日報・週報・月報の生成とPDF出力" />
      <div className="p-8">
        <div className="card p-1 inline-flex gap-1 mb-4">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/reports?type=${t.id}`}
              className={
                t.id === type
                  ? "btn-primary text-sm py-1 px-4"
                  : "btn-secondary text-sm py-1 px-4 border-transparent"
              }
            >
              {t.label}
            </Link>
          ))}
        </div>

        {type === "daily" && <DailyList />}
        {type === "weekly" && <WeeklyList />}
        {type === "monthly" && <MonthlyList />}
      </div>
    </div>
  );
}

async function DailyList() {
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDateJa(d));
  }
  const aggs = await prisma.dailyAggregate.findMany({ where: { date: { in: dates } } });
  const totals = new Map<string, { feed: number; production: number; mortality: number }>();
  for (const a of aggs) {
    const cur = totals.get(a.date) ?? { feed: 0, production: 0, mortality: 0 };
    cur.feed += a.totalFeedKg;
    cur.production += a.totalProductionKg;
    cur.mortality += a.totalMortalityCount;
    totals.set(a.date, cur);
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr>
            <th className="table-th">日付</th>
            <th className="table-th text-right">給餌量(kg)</th>
            <th className="table-th text-right">生産量(kg)</th>
            <th className="table-th text-right">死亡数</th>
            <th className="table-th text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((d) => {
            const t = totals.get(d);
            return (
              <tr key={d}>
                <td className="table-td font-medium">{d}</td>
                <td className="table-td text-right font-mono">{t?.feed?.toFixed(1) ?? "0.0"}</td>
                <td className="table-td text-right font-mono">{t?.production?.toFixed(1) ?? "0.0"}</td>
                <td className="table-td text-right font-mono">{t?.mortality ?? 0}</td>
                <td className="table-td text-right space-x-3">
                  <Link href={`/reports/daily/${d}`} className="text-sky-600 text-sm">プレビュー</Link>
                  <a href={`/api/reports/daily/pdf?date=${d}`} className="text-emerald-600 text-sm">PDF</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function WeeklyList() {
  const weeks: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 16; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const k = isoWeek(d);
    if (!seen.has(k)) {
      seen.add(k);
      weeks.push(k);
    }
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="table-th">週</th>
            <th className="table-th text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w}>
              <td className="table-td font-medium">{w}</td>
              <td className="table-td text-right space-x-3">
                <Link href={`/reports/weekly/${w}`} className="text-sky-600 text-sm">プレビュー</Link>
                <a href={`/api/reports/weekly/pdf?week=${w}`} className="text-emerald-600 text-sm">PDF</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function MonthlyList() {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            <th className="table-th">月</th>
            <th className="table-th text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m}>
              <td className="table-td font-medium">{m}</td>
              <td className="table-td text-right space-x-3">
                <Link href={`/reports/monthly/${m}`} className="text-sky-600 text-sm">プレビュー</Link>
                <a href={`/api/reports/monthly/pdf?month=${m}`} className="text-emerald-600 text-sm">PDF</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
