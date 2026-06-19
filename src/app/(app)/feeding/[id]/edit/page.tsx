import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { updateFeedingLog } from "../../actions";
import { requireSession } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { formatDateJa } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditFeedingPage({
  params,
}: {
  params: { id: string };
}) {
  await requireSession();
  const [log, ponds, feeds] = await Promise.all([
    prisma.feedingLog.findUnique({
      where: { id: params.id },
      include: { pond: true, feed: true },
    }),
    prisma.pond.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.feed.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);
  if (!log) return notFound();
  const action = updateFeedingLog.bind(null, log.id);
  const today = new Date().toISOString().split("T")[0];
  return (
    <div>
      <PageHeader title="給餌記録の編集" description={`元: ${formatDateJa(log.recordedAt)} ${log.pond.name}`} />
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
              <label className="label">飼料 *</label>
              <select name="feedId" required className="input" defaultValue={log.feedId}>
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
                  defaultValue={log.amountKg}
                  className="input text-2xl text-center font-bold py-4"
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
                  defaultValue={log.mealsCount}
                  className="input text-2xl text-center font-bold py-4"
                />
              </div>
            </div>
            <div>
              <label className="label">備考</label>
              <textarea name="note" rows={3} className="input" defaultValue={log.note ?? ""} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Link href="/feeding" className="btn-secondary">
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
