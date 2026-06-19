import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteSpecies, toggleSpeciesActive } from "./actions";
import { requireSession } from "@/lib/auth-guard";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";

export const dynamic = "force-dynamic";

export default async function SpeciesPage() {
  const user = await requireSession();
  const isAdmin = user.role === "admin";
  const list = await prisma.fishSpecies.findMany({
    orderBy: [{ isActive: "desc" }, { code: "asc" }],
  });
  return (
    <div>
      <PageHeader
        title="魚種マスタ"
        description="養殖対象の魚種を管理"
        action={isAdmin ? { href: "/masters/fish-species/new", label: "+ 新規追加" } : undefined}
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
                <th className="table-th">和名</th>
                <th className="table-th">学名</th>
                <th className="table-th">最適水温</th>
                <th className="table-th">目標FCR</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                  <td className="table-td">
                    {s.isActive ? (
                      <span className="badge-info">有効</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">無効</span>
                    )}
                  </td>
                  <td className="table-td font-mono">{s.code}</td>
                  <td className="table-td font-medium">{s.nameJa}</td>
                  <td className="table-td italic text-slate-500">{s.nameSci ?? "-"}</td>
                  <td className="table-td">
                    {s.optimalTempMin && s.optimalTempMax
                      ? `${s.optimalTempMin}〜${s.optimalTempMax}℃`
                      : "-"}
                  </td>
                  <td className="table-td">
                    {s.targetFcrMin && s.targetFcrMax
                      ? `${s.targetFcrMin}〜${s.targetFcrMax}`
                      : "-"}
                  </td>
                  <td className="table-td text-right space-x-2">
                    {isAdmin && (
                      <>
                        <Link
                          href={`/masters/fish-species/${s.id}/edit`}
                          className="text-sky-600 text-sm"
                        >
                          編集
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await toggleSpeciesActive(s.id);
                          }}
                          className="inline"
                        >
                          <button type="submit" className="text-amber-600 text-sm">
                            {s.isActive ? "無効化" : "有効化"}
                          </button>
                        </form>
                        <ConfirmDeleteForm
                          action={async () => {
                            "use server";
                            await deleteSpecies(s.id);
                          }}
                          itemName={`${s.code} ${s.nameJa}`}
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
