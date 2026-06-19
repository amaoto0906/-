import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { updateProductionLog } from "../../actions";
import { requireSession } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { formatDateJa } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditProductionPage({
  params,
}: {
  params: { id: string };
}) {
  await requireSession();
  const [log, ponds, species] = await Promise.all([
    prisma.productionLog.findUnique({
      where: { id: params.id },
      include: { pond: true, species: true },
    }),
    prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.fishSpecies.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);
  if (!log) return notFound();
  const action = updateProductionLog.bind(null, log.id);
  const today = new Date().toISOString().split("T")[0];
  return (
    <div>
      <PageHeader
        title="生産記録の編集"
        description={`元: ${formatDateJa(log.recordedAt)} ${log.pond.name} ${log.species.nameJa}`}
      />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <form action={action} className="space-y-5">
            <div>
              <label className="label">日付 *</label>
              <input
                name="recordedAt"
                type="date"
                required
                defaultValue={formatDateJa(log.recordedAt)}
                max={today}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">池・水槽 *</label>
                <select name="pondId" required className="input" defaultValue={log.pondId}>
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">魚種 *</label>
                <select name="speciesId" required className="input" defaultValue={log.speciesId}>
                  {species.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameJa}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">出荷尾数</label>
                <input
                  name="harvestedCount"
                  type="number"
                  min="0"
                  defaultValue={log.harvestedCount}
                  className="input text-lg text-center font-mono"
                />
              </div>
              <div>
                <label className="label">出荷総重量 (kg)</label>
                <input
                  name="harvestedWeightKg"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={log.harvestedWeightKg}
                  className="input text-lg text-center font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">死亡数</label>
                <input
                  name="mortalityCount"
                  type="number"
                  min="0"
                  defaultValue={log.mortalityCount}
                  className="input text-lg text-center font-mono"
                />
              </div>
              <div>
                <label className="label">平均体重 (g)</label>
                <input
                  name="avgWeightG"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={log.avgWeightG ?? ""}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">備考</label>
              <textarea name="note" rows={2} className="input" defaultValue={log.note ?? ""} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/production" className="btn-secondary">
                キャンセル
              </Link>
              <button type="submit" className="btn-primary">
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
