import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { createFeedingLog } from "../actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewFeedingPage() {
  const [ponds, feeds] = await Promise.all([
    prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.feed.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <PageHeader title="給餌入力" description="本日の給餌量を記録" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <form action={createFeedingLog} className="space-y-5">
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
            <div>
              <label className="label">飼料 *</label>
              <select name="feedId" required className="input">
                <option value="">選択してください</option>
                {feeds.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.code}] {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">給餌量 (kg) *</label>
                <input
                  name="amountKg"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10000"
                  required
                  className="input text-2xl text-center font-bold py-4"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="label">給餌回数 *</label>
                <input
                  name="mealsCount"
                  type="number"
                  step="1"
                  min="1"
                  max="20"
                  required
                  defaultValue="1"
                  className="input text-2xl text-center font-bold py-4"
                />
              </div>
            </div>
            <div>
              <label className="label">備考</label>
              <textarea name="note" rows={3} className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/feeding" className="btn-secondary">
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
