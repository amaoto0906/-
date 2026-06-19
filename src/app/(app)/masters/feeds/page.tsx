import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteFeed, toggleFeedActive } from "./actions";
import { requireSession } from "@/lib/auth-guard";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const user = await requireSession();
  const isAdmin = user.role === "admin";
  const list = await prisma.feed.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });
  return (
    <div>
      <PageHeader
        title="飼料マスタ"
        description="使用する飼料の銘柄を管理"
        action={isAdmin ? { href: "/masters/feeds/new", label: "+ 新規追加" } : undefined}
      />
      <div className="p-8">
        {!isAdmin && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            🔒 マスタ管理は管理者のみ編集できます。閲覧専用モードです。
          </div>
        )}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="table-th">状態</th>
                <th className="table-th">コード</th>
                <th className="table-th">名称</th>
                <th className="table-th">メーカー</th>
                <th className="table-th">単位</th>
                <th className="table-th">蛋白%</th>
                <th className="table-th">脂質%</th>
                <th className="table-th">単価</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className={!f.isActive ? "opacity-50" : ""}>
                  <td className="table-td">
                    {f.isActive ? (
                      <span className="badge-info">有効</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">無効</span>
                    )}
                  </td>
                  <td className="table-td font-mono">{f.code}</td>
                  <td className="table-td font-medium">{f.name}</td>
                  <td className="table-td">{f.manufacturer ?? "-"}</td>
                  <td className="table-td font-mono">{f.unit}</td>
                  <td className="table-td">{f.proteinPct ?? "-"}</td>
                  <td className="table-td">{f.fatPct ?? "-"}</td>
                  <td className="table-td">
                    {f.unitPrice ? `¥${f.unitPrice}` : "-"}
                  </td>
                  <td className="table-td text-right space-x-2">
                    {isAdmin && (
                      <>
                        <Link
                          href={`/masters/feeds/${f.id}/edit`}
                          className="text-sky-600 text-sm"
                        >
                          編集
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await toggleFeedActive(f.id);
                          }}
                          className="inline"
                        >
                          <button type="submit" className="text-amber-600 text-sm">
                            {f.isActive ? "無効化" : "有効化"}
                          </button>
                        </form>
                        <ConfirmDeleteForm
                          action={async () => {
                            "use server";
                            await deleteFeed(f.id);
                          }}
                          itemName={`${f.code} ${f.name}`}
                        />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
