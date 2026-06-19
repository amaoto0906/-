import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deletePond, togglePondActive } from "./actions";
import { requireSession } from "@/lib/auth-guard";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";

export const dynamic = "force-dynamic";

export default async function PondsPage() {
  const user = await requireSession();
  const isAdmin = user.role === "admin";
  const ponds = await prisma.pond.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
    include: { farm: true, _count: { select: { feedingLogs: true } } },
  });

  return (
    <div>
      <PageHeader
        title="池・水槽マスタ"
        description="養魚場の池および陸上水槽を管理"
        action={isAdmin ? { href: "/masters/ponds/new", label: "+ 新規追加" } : undefined}
      />
      <div className="p-8">
        {!isAdmin && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            🔒 マスタ管理は管理者のみ編集できます。閲覧専用モードです。
          </div>
        )}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="table-th">状態</th>
                <th className="table-th">コード</th>
                <th className="table-th">名称</th>
                <th className="table-th">種別</th>
                <th className="table-th">容量(m³)</th>
                <th className="table-th">面積(m²)</th>
                <th className="table-th">給餌記録</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {ponds.map((p) => (
                <tr key={p.id} className={!p.isActive ? "opacity-50" : ""}>
                  <td className="table-td">
                    {p.isActive ? (
                      <span className="badge-info">有効</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">無効</span>
                    )}
                  </td>
                  <td className="table-td font-mono">{p.code}</td>
                  <td className="table-td font-medium">{p.name}</td>
                  <td className="table-td">
                    <span className="badge-info">
                      {p.type === "tank" ? "水槽" : "池"}
                    </span>
                  </td>
                  <td className="table-td">{p.volumeM3 ?? "-"}</td>
                  <td className="table-td">{p.areaM2 ?? "-"}</td>
                  <td className="table-td">{p._count.feedingLogs} 件</td>
                  <td className="table-td text-right space-x-2">
                    {isAdmin && (
                      <>
                        <Link
                          href={`/masters/ponds/${p.id}/edit`}
                          className="text-sky-600 text-sm"
                        >
                          編集
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await togglePondActive(p.id);
                          }}
                          className="inline"
                        >
                          <button type="submit" className="text-amber-600 text-sm">
                            {p.isActive ? "無効化" : "有効化"}
                          </button>
                        </form>
                        <ConfirmDeleteForm
                          action={async () => {
                            "use server";
                            await deletePond(p.id);
                          }}
                          itemName={`${p.code} ${p.name}`}
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
