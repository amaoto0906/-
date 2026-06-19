import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { createWaterQualityLog } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewWaterQualityPage() {
  const ponds = await prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <PageHeader title="水質入力" description="水温・pH・溶存酸素を記録" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <form action={createWaterQualityLog} className="space-y-5">
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">水温 (℃)</label>
                <input
                  name="tempC"
                  type="number"
                  step="0.1"
                  className="input text-lg text-center font-mono"
                />
              </div>
              <div>
                <label className="label">pH</label>
                <input
                  name="ph"
                  type="number"
                  step="0.01"
                  className="input text-lg text-center font-mono"
                />
              </div>
              <div>
                <label className="label">DO (mg/L)</label>
                <input
                  name="doMgL"
                  type="number"
                  step="0.1"
                  className="input text-lg text-center font-mono"
                />
              </div>
            </div>
            <div>
              <label className="label">備考</label>
              <textarea name="note" rows={2} className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/dashboard" className="btn-secondary">
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
