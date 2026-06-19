import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { formatDateJa, formatNumber } from "@/lib/utils";
import { deleteFeedingLog } from "./actions";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { Pagination } from "@/components/pagination";
import { parseLocalDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SP = {
  pond?: string;
  feed?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: string;
};

export default async function FeedingHistoryPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const perPage = 20;

  const where: {
    pondId?: string;
    feedId?: string;
    recordedAt?: { gte?: Date; lte?: Date };
    OR?: Array<{ note?: { contains: string }; pond?: { name: { contains: string } }; feed?: { name: { contains: string } } }>;
  } = {};
  if (searchParams.pond) where.pondId = searchParams.pond;
  if (searchParams.feed) where.feedId = searchParams.feed;
  if (searchParams.from || searchParams.to) {
    where.recordedAt = {};
    if (searchParams.from) where.recordedAt.gte = parseLocalDate(searchParams.from);
    if (searchParams.to) {
      const end = parseLocalDate(searchParams.to);
      end.setHours(23, 59, 59, 999);
      where.recordedAt.lte = end;
    }
  }
  if (searchParams.q) {
    where.OR = [
      { note: { contains: searchParams.q } },
      { pond: { name: { contains: searchParams.q } } },
      { feed: { name: { contains: searchParams.q } } },
    ];
  }

  const [total, logs, ponds, feeds] = await Promise.all([
    prisma.feedingLog.count({ where }),
    prisma.feedingLog.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { pond: true, feed: true, feederUser: true },
    }),
    prisma.pond.findMany({ orderBy: { code: "asc" } }),
    prisma.feed.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="給餌履歴"
        description={`全 ${total.toLocaleString()} 件`}
        action={{ href: "/feeding/new", label: "+ 新規入力" }}
      />
      <div className="p-8">
        <form className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="label">池</label>
            <select name="pond" className="input" defaultValue={searchParams.pond ?? ""}>
              <option value="">全て</option>
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">飼料</label>
            <select name="feed" className="input" defaultValue={searchParams.feed ?? ""}>
              <option value="">全て</option>
              {feeds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">期間 (開始)</label>
            <input type="date" name="from" className="input" defaultValue={searchParams.from ?? ""} />
          </div>
          <div>
            <label className="label">期間 (終了)</label>
            <input type="date" name="to" className="input" defaultValue={searchParams.to ?? ""} />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">キーワード</label>
            <input type="text" name="q" placeholder="備考/池名/飼料名" className="input" defaultValue={searchParams.q ?? ""} />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">検索</button>
            <Link href="/feeding" className="btn-secondary">クリア</Link>
          </div>
        </form>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="table-th">日付</th>
                <th className="table-th">池</th>
                <th className="table-th">飼料</th>
                <th className="table-th text-right">給餌量(kg)</th>
                <th className="table-th text-right">回数</th>
                <th className="table-th">記録者</th>
                <th className="table-th">備考</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center text-slate-500 py-8">
                    記録が見つかりません
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="table-td">{formatDateJa(l.recordedAt)}</td>
                    <td className="table-td">{l.pond.name}</td>
                    <td className="table-td">{l.feed.name}</td>
                    <td className="table-td text-right font-mono">{formatNumber(l.amountKg)}</td>
                    <td className="table-td text-right font-mono">{l.mealsCount}</td>
                    <td className="table-td">{l.feederUser?.name ?? "-"}</td>
                    <td className="table-td text-xs max-w-xs truncate">{l.note ?? "-"}</td>
                    <td className="table-td text-right space-x-2">
                      <Link href={`/feeding/${l.id}/edit`} className="text-sky-600 text-sm">編集</Link>
                      <ConfirmDeleteForm
                        action={async () => {
                          "use server";
                          await deleteFeedingLog(l.id);
                        }}
                        itemName={`${formatDateJa(l.recordedAt)} ${l.pond.name} ${l.amountKg}kg`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} perPage={perPage} total={total} searchParams={searchParams} basePath="/feeding" />
      </div>
    </div>
  );
}
