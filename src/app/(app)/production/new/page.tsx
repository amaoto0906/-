import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { createProductionLog } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewProductionPage() {
  const [ponds, species] = await Promise.all([
    prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.fishSpecies.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <PageHeader title="生産入力" description="出荷数・死亡数を記録" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <form action={createProductionLog} className="space-y-5">
            <div>
              <label className="label">日付 *</label>
              <input
                name="recordedAt"
                type="date"
                required
                defaultValue={today}
                max={today}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">池・水槽 *</label>
                <select name="pondId" required className="input">
                  <option value="">選択してください</option>
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">魚種 *</label>
                <select name="speciesId" required className="input">
                  <option value="">選択してください</option>
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
                  defaultValue="0"
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
                  defaultValue="0"
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
                  defaultValue="0"
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
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">備考</label>
              <textarea name="note" rows={2} className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/production" className="btn-secondary">
                キャンセル
              </Link>
              <button type="submit" className="btn-primary">
                記録する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
